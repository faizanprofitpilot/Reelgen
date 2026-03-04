"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProjectStatusBadge } from "@/components/ProjectStatusBadge";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Download, ArrowLeft, Video, Clock, FileText, Settings } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/types/project";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function FailedStateRecover({
  projectId,
  errorMessage,
  onRecovered,
}: {
  projectId: string;
  errorMessage?: string | null;
  onRecovered: () => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecover() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    try {
      const body = trimmed.startsWith("http")
        ? { videoUrl: trimmed }
        : UUID_REGEX.test(trimmed)
          ? { taskId: trimmed }
          : null;
      if (!body) {
        setError("Paste a Runware task ID (e.g. 23846ef5-6834-4c77-8d44-26f286b8262a) or a video URL");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/projects/${projectId}/recover-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to save video");
        return;
      }
      onRecovered();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-16 px-4 max-w-lg mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Generation Failed</h3>
      {errorMessage && (
        <p className="text-red-400 mb-4 max-w-md mx-auto bg-red-500/5 p-3 rounded border border-red-500/10 text-sm">
          {errorMessage}
        </p>
      )}
      <p className="text-sm text-muted-foreground mb-4">
        If Runware shows the video was created, paste your <strong>Runware task ID</strong> or the video URL below.
      </p>
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          placeholder="Task ID (e.g. 23846ef5-6834-4c77-8d44-26f286b8262a) or https://..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button
          onClick={handleRecover}
          disabled={loading || !input.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? "Fetching & saving..." : "Fetch video and save to project"}
        </Button>
      </div>
      <Link href="/dashboard">
        <Button variant="outline" className="border-white/10 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const supabase = createClient();
  const [project, setProject] = useState<Project | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project?.status === "GENERATING") {
      setIsPolling(true);
      const interval = setInterval(() => {
        loadProject();
      }, 5000);

      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    } else {
      setIsPolling(false);
      if (project?.status === "COMPLETE" && project?.video_path) {
        fetchVideoUrl(projectId);
      }
    }
  }, [projectId, project?.status, project?.video_path]);

  async function loadProject() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Error loading project:", error);
      return;
    }

    setProject(data);
  }

  async function fetchVideoUrl(pid: string) {
    try {
      const res = await fetch(`/api/projects/${pid}/video-url`);
      if (!res.ok) throw new Error("Failed to get video URL");
      const { url } = await res.json();
      setVideoUrl(url);
    } catch (error) {
      console.error("Error loading video URL:", error);
    }
  }

  async function handleDownload() {
    if (!videoUrl) return;

    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `reelgen-${projectId}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-background/50 backdrop-blur-xl mb-8">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/Reelgen new logo.png" alt="Reelgen" className="h-10 w-10 shrink-0 rounded-lg object-contain align-middle" />
            <span className="text-xl font-bold leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Reelgen
            </span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="hover:bg-white/10 text-muted-foreground hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Video & Status */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-white/10 bg-black/40">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl text-white">Project Output</CardTitle>
                  <ProjectStatusBadge status={project.status} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {project.status === "GENERATING" && (
                  <div className="aspect-[9/16] w-full max-w-sm mx-auto flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white/5 to-transparent">
                    <div className="relative mb-8 animate-bounce" style={{ animationDuration: "2s" }}>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border-2 border-white/10 flex items-center justify-center shadow-lg">
                        <span className="text-4xl" role="img" aria-hidden>🎬</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary/80 border-2 border-background flex items-center justify-center">
                        <RefreshCw className="h-3 w-3 text-white animate-spin" style={{ animationDuration: "3s" }} />
                      </div>
                    </div>
                    <div className="w-full max-w-[200px] h-2 rounded-full bg-white/10 overflow-hidden mb-4">
                      <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-loading-bar" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Baking your video</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Usually 5–6 minutes. Grab a coffee — we’ll update when it’s ready.
                    </p>
                  </div>
                )}

                {project.status === "COMPLETE" && project.video_path && !videoUrl && (
                  <div className="aspect-[9/16] w-full max-w-sm mx-auto flex flex-col items-center justify-center p-8 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mb-4" />
                    <p className="text-muted-foreground">Loading video...</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-muted-foreground hover:text-white"
                      onClick={() => fetchVideoUrl(projectId)}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {project.status === "COMPLETE" && videoUrl && (
                  <div className="p-8 bg-black/20">
                    <VideoPlayer videoUrl={videoUrl} />
                    <div className="flex justify-center mt-8">
                      <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Download className="mr-2 h-4 w-4" />
                        Download Video
                      </Button>
                    </div>
                  </div>
                )}

                {project.status === "COMPLETE" && !project.video_path && (
                  <div className="py-16 text-center text-muted-foreground">
                    <p>No video file recorded for this project.</p>
                  </div>
                )}

                {project.status === "FAILED" && (
                  <FailedStateRecover
                    projectId={projectId}
                    errorMessage={project.error}
                    onRecovered={() => loadProject()}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - only what the user needs */}
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Settings className="h-4 w-4 text-blue-400" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Product</p>
                  <p className="font-medium text-white">
                    {project.extra_instructions?.match(/Product:\s*([^|]+)/)?.[1]?.trim() || "—"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                    <p className="font-medium text-white">{project.duration_seconds}s</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Pace</p>
                    <p className="font-medium text-white capitalize">{project.pace}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Caption Style</p>
                  <p className="font-medium text-white capitalize">{project.caption_style}</p>
                </div>
                <div className="space-y-1 pt-2 border-t border-white/10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Created
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(project.created_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Script
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/20 p-4 rounded-lg border border-white/5 text-sm text-gray-300 leading-relaxed max-h-60 overflow-y-auto">
                  {project.script}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
