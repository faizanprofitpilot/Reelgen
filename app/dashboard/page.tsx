import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrlServer } from "@/lib/storage-server";
import { DashboardView } from "@/components/DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: rawProjects }, { data: avatars }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, template_id, status, duration_seconds, pace, created_at, updated_at, video_path")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("avatars").select("*"),
  ]);

  const projects = await Promise.all(
    (rawProjects ?? []).map(async (p) => {
      let videoPreviewUrl: string | null = null;
      if (p.video_path) {
        try {
          videoPreviewUrl = await getSignedUrlServer("uploads", p.video_path, 3600);
        } catch {
          // ignore
        }
      }
      return { ...p, videoPreviewUrl };
    })
  );

  return (
    <DashboardView
      userEmail={user.email}
      projects={projects}
      avatars={avatars ?? []}
    />
  );
}
