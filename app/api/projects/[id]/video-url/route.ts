import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrlServer } from "@/lib/storage-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
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
      .select("id, video_path, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!project.video_path) {
      return NextResponse.json(
        { error: "No video available for this project" },
        { status: 404 }
      );
    }

    const url = await getSignedUrlServer("uploads", project.video_path, 3600);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Video URL error:", error);
    return NextResponse.json(
      { error: "Failed to get video URL" },
      { status: 500 }
    );
  }
}
