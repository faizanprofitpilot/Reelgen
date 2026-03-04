import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectId = formData.get("projectId") as string;
    const files = formData.getAll("files") as File[];

    if (!projectId || files.length === 0) {
      return NextResponse.json(
        { error: "Missing projectId or files" },
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
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const paths: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `projects/${projectId}/product/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("uploads")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        return NextResponse.json(
          {
            error: "Failed to upload image",
            detail: uploadError.message,
          },
          { status: 500 }
        );
      }

      paths.push(filePath);
    }

    return NextResponse.json({ paths });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const detail = error instanceof Error ? error.stack : String(error);
    console.error("Upload error:", detail);
    return NextResponse.json(
      {
        error: "Upload failed",
        detail,
      },
      { status: 500 }
    );
  }
}
