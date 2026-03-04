import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { buildKlingPrompt } from "@/lib/studio-utils";
import { generateKlingI2VVideo } from "@/lib/runware";
import type { StudioState, PresentationMode } from "@/types/studio";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value == null || value === "" || value === "undefined") {
    throw new Error(`Missing or invalid environment variable: ${name}. Add it to .env.local and restart the dev server.`);
  }
  return value;
}

/** Download from Supabase Storage and return a base64 data URI (no signed URL needed). */
async function storageBlobToDataUri(
  supabase: ReturnType<typeof createServiceRoleClient>,
  bucket: string,
  path: string,
  fallbackMime = "image/jpeg"
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`Storage download failed (${bucket}/${path}): ${error.message}`);
  if (!data) throw new Error(`No data from storage (${bucket}/${path})`);
  const buf = Buffer.from(await data.arrayBuffer());
  const base64 = buf.toString("base64");
  const type = data.type || fallbackMime;
  return `data:${type};base64,${base64}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    requireEnv("RUNWARE_API_KEY");

    const projectId = params.id;
    // Auth (caller) — must own this project.
    const supabaseAuth = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client (credits + storage + generation pipeline)
    const supabase = createServiceRoleClient();

    // Verify project exists and get user
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch template, avatar, and product images
    const { data: template } = await supabase
      .from("templates")
      .select("*")
      .eq("id", project.template_id)
      .single();

    const { data: avatar } = await supabase
      .from("avatars")
      .select("*")
      .eq("id", project.avatar_id)
      .single();

    const { data: assets } = await supabase
      .from("project_assets")
      .select("*")
      .eq("project_id", projectId)
      .eq("type", "product_image");

    if (!template || !avatar || !assets || assets.length === 0) {
      await supabase
        .from("projects")
        .update({
          status: "FAILED",
          error: "Missing required data (template, avatar, or product images)",
        })
        .eq("id", projectId);
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------------------
    // Credits billing (internal, no Stripe yet)
    // - 1 credit = 1 second of video generation
    // - Credits are deducted at generation start (before calling Runware)
    // - If project becomes FAILED, we refund (idempotent via DB ledger)
    // ---------------------------------------------------------------------
    const creditsCost = project.duration_seconds as number;
    const { error: chargeError } = await supabase.rpc("charge_credits", {
      p_user_id: user.id,
      p_project_id: projectId,
      p_seconds: creditsCost,
    });

    if (chargeError) {
      const insufficient =
        chargeError.message?.includes("INSUFFICIENT_CREDITS") ||
        chargeError.code === "P0001";

      if (insufficient) {
        const { data: billingRow } = await supabase
          .from("users")
          .select("credits_balance")
          .eq("id", user.id)
          .maybeSingle();

        return NextResponse.json(
          {
            error: "INSUFFICIENT_CREDITS",
            required: creditsCost,
            balance: billingRow?.credits_balance ?? 0,
          },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: "Billing error", message: chargeError.message },
        { status: 500 }
      );
    }

    // Mark generating only after we successfully charged credits.
    await supabase
      .from("projects")
      .update({ status: "GENERATING" })
      .eq("id", projectId);

    // Get avatar image as base64 data URI (use custom upload when set, else avatar row)
    let avatarDataUri: string;
    const avatarPath = project.custom_avatar_path ?? avatar.image_path;
    if (avatarPath.startsWith("http")) {
      const res = await fetch(avatarPath);
      if (!res.ok) throw new Error(`Failed to fetch avatar image: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const type = res.headers.get("content-type") || "image/jpeg";
      avatarDataUri = `data:${type};base64,${buf.toString("base64")}`;
    } else if (avatarPath.startsWith("/")) {
      const origin = request.nextUrl?.origin ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const res = await fetch(origin + avatarPath);
      if (!res.ok) throw new Error(`Failed to fetch avatar image: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const type = res.headers.get("content-type") || "image/jpeg";
      avatarDataUri = `data:${type};base64,${buf.toString("base64")}`;
    } else {
      avatarDataUri = await storageBlobToDataUri(supabase, "avatars", avatarPath);
    }

    const productDataUris = await Promise.all(
      assets.map((asset) => storageBlobToDataUri(supabase, "uploads", asset.path))
    );

    // Parse extra_instructions to reconstruct StudioState for prompt building
    const extras = project.extra_instructions || "";
    const extractField = (key: string): string => {
      const match = extras.match(new RegExp(`${key}: ([^|]+)`));
      return match ? match[1].trim() : "";
    };

    const presentationMode = extractField("Presentation mode") as PresentationMode || "NARRATION";
    const productName = extractField("Product") || "";
    const benefits = extractField("Benefits") || "";
    const transcriptProvided = extractField("Transcript provided") === "Yes";

    // Use custom prompt if stored, otherwise build from presets
    const customPromptMarker = "<<<CUSTOM_PROMPT>>>";
    const customPromptEnd = "<<<END>>>";
    let prompt: string;
    if (extras.includes(customPromptMarker)) {
      const start = extras.indexOf(customPromptMarker) + customPromptMarker.length;
      const end = extras.indexOf(customPromptEnd, start);
      prompt = (end !== -1 ? extras.slice(start, end) : extras.slice(start)).trim();
      if (!prompt) {
        await supabase
          .from("projects")
          .update({ status: "FAILED", error: "Custom prompt was empty" })
          .eq("id", projectId);
        return NextResponse.json({ error: "Invalid custom prompt" }, { status: 400 });
      }
    } else {
      const studioState: Partial<StudioState> = {
        presentationMode,
        durationSeconds: project.duration_seconds,
        productName,
        benefits,
        transcript: transcriptProvided ? project.script : "",
        captionStyle: project.caption_style,
        pace: project.pace,
        subtitles: !extras.includes("No subtitles"),
        vibe: extractField("Vibe") || "Friendly",
        ctaText: extractField("CTA") || "",
        structurePreset: "testimonial",
        avatarId: project.avatar_id,
        productImages: [],
        logo: null,
      };
      prompt = buildKlingPrompt(studioState as StudioState);
    }

    try {
      // Generate video (pass data URIs so Runware doesn't need to fetch signed URLs)
      const videoUrl = await generateKlingI2VVideo({
        prompt,
        avatarImageUrl: avatarDataUri,
        productImageUrls: productDataUris,
        durationSeconds: project.duration_seconds,
      });

      // Download video and upload to Supabase Storage
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error("Failed to download video from Runware");
      }

      const videoBuffer = await videoResponse.arrayBuffer();
      const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });
      const videoFile = new File([videoBlob], "final.mp4", { type: "video/mp4" });

      const videoPath = `projects/${projectId}/final.mp4`;
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(videoPath, videoFile, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }

      // Update project status
      await supabase
        .from("projects")
        .update({
          status: "COMPLETE",
          video_path: videoPath,
          error: null,
        })
        .eq("id", projectId);
    } catch (err) {
      // If the generation pipeline fails, mark FAILED and refund credits.
      const message = err instanceof Error ? err.message : "Unknown error";
      await supabase
        .from("projects")
        .update({ status: "FAILED", error: message })
        .eq("id", projectId);
      await supabase.rpc("refund_project_credits", { p_project_id: projectId });
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Generation error:", error);

    try {
      const supabase = createServiceRoleClient();
      await supabase
        .from("projects")
        .update({ status: "FAILED", error: message })
        .eq("id", params.id);

      // Best-effort refund (idempotent via DB ledger)
      await supabase.rpc("refund_project_credits", { p_project_id: params.id });
    } catch {
      // Ignore if we can't update (e.g. missing env)
    }

    return NextResponse.json(
      { error: "Generation failed", message },
      { status: 500 }
    );
  }
}
