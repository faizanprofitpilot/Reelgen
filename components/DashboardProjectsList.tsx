"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/ProjectStatusBadge";
import type { ProjectStatus } from "@/types/project";
import { Plus, Video, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SortOrder = "newest" | "oldest";

interface Project {
  id: string;
  template_id: string;
  status: string;
  duration_seconds: number;
  pace: string;
  created_at: string;
  updated_at?: string;
  video_path?: string | null;
  videoPreviewUrl?: string | null;
}

interface DashboardProjectsListProps {
  projects: Project[] | null;
}

export function DashboardProjectsList({ projects }: DashboardProjectsListProps) {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  async function handleDelete(projectId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId) return;
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Failed to delete project.");
    } catch {
      alert("Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  }

  const sorted = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    const copy = [...projects];
    copy.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });
    return copy;
  }, [projects, sortOrder]);

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] shadow-none">
          <CardContent className="flex flex-col items-center text-center pt-10 pb-10">
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-5">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1.5">Create your first project</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Generate AI-powered product videos in seconds. Upload your product, pick an avatar, and go.
            </p>
            <Link href="/create">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
            <Link
              href="/create"
              className="mt-4 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              See examples
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort:</span>
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="appearance-none rounded-lg border border-white/10 bg-white/5 pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
        {sorted.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="w-full max-w-[200px]">
            <Card
              className={cn(
                "h-full w-full rounded-xl border border-white/10 bg-white/[0.02] transition-all duration-200 relative group",
                "hover:border-white/20 hover:bg-white/[0.04] hover:shadow-lg"
              )}
              onMouseEnter={() => {
                const v = videoRefs.current[project.id];
                if (v) {
                  v.currentTime = 0;
                  v.play().catch(() => {});
                }
              }}
              onMouseLeave={() => {
                const v = videoRefs.current[project.id];
                if (v) {
                  v.pause();
                  v.currentTime = 0;
                }
              }}
            >
              <div className="aspect-[9/16] w-full rounded-t-xl bg-black flex items-center justify-center overflow-hidden relative">
                {project.videoPreviewUrl ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[project.id] = el;
                    }}
                    src={project.videoPreviewUrl}
                    muted
                    playsInline
                    loop
                    preload="auto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Video className="h-8 w-8 text-white/20" />
                )}
                <button
                  type="button"
                  onClick={(e) => handleDelete(project.id, e)}
                  disabled={deletingId === project.id}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  aria-label="Delete project"
                >
                  {deletingId === project.id ? (
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-white leading-tight line-clamp-1">
                    {project.template_id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </h3>
                  <ProjectStatusBadge status={project.status as ProjectStatus} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(project.created_at).toLocaleDateString()} · {project.duration_seconds}s
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <span className="text-xs text-primary hover:underline">View project →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
