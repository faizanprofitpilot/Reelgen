import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getVideoUrlByTaskId } from "@/lib/runware";

/**
 * Recover a failed project by providing either:
 * - videoUrl: direct link to the video file (e.g. from Runware)
 * - taskId: Runware task UUID (we fetch the video URL from Runware, then download and save)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    let videoUrl: string | null =
      typeof body?.videoUrl === "string" ? body.videoUrl.trim() || null : null;
    const taskId = typeof body?.taskId === "string" ? body.taskId.trim() || null : null;

    if (taskId) {
      try {
        videoUrl = await getVideoUrlByTaskId(taskId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to fetch from Runware";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    if (!videoUrl || !videoUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Provide either a video URL or a Runware task ID" },
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
      .select("id, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 403 }
      );
    }

    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: "Could not download video from the provided URL" },
        { status: 400 }
      );
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });
    const videoFile = new File([videoBlob], "final.mp4", { type: "video/mp4" });

    const videoPath = `projects/${projectId}/final.mp4`;
    const supabaseAdmin = createServiceRoleClient();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("uploads")
      .upload(videoPath, videoFile, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to save video: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("projects")
      .update({
        status: "COMPLETE",
        video_path: videoPath,
        error: null,
      })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recover video error:", error);
    return NextResponse.json(
      { error: "Recovery failed" },
      { status: 500 }
    );
  }
}
