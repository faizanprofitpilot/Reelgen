import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Missing or invalid image file" },
        { status: 400 }
      );
    }

    const MAX_AVATAR_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 25MB. Please choose a smaller file." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 403 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `custom/${projectId}/avatar.${ext}`;

    const supabaseAdmin = createServiceRoleClient();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload avatar", detail: uploadError.message },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("projects")
      .update({ custom_avatar_path: path })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save avatar reference" },
        { status: 500 }
      );
    }

    return NextResponse.json({ path });
  } catch (error) {
    console.error("Avatar route error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
