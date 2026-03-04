"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/DashboardNav";
import { DashboardProjectsList } from "@/components/DashboardProjectsList";
import { DashboardAvatarsSection } from "@/components/DashboardAvatarsSection";
import { Plus } from "lucide-react";
import type { Avatar } from "@/types/project";

type ProjectWithPreview = {
  id: string;
  template_id: string;
  status: string;
  duration_seconds: number;
  pace: string;
  created_at: string;
  updated_at?: string;
  video_path?: string | null;
  videoPreviewUrl?: string | null;
};

interface DashboardViewProps {
  userEmail: string | undefined;
  projects: ProjectWithPreview[];
  avatars: Avatar[];
}

export function DashboardView({ userEmail, projects, avatars }: DashboardViewProps) {
  const [view, setView] = useState<"dashboard" | "avatars">("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        userEmail={userEmail}
        currentView={view}
        onViewChange={setView}
        variant="dashboard"
      />

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {view === "dashboard" && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">Projects</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your video projects</p>
              </div>
              <Link href="/create" className="shrink-0">
                <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
            <DashboardProjectsList projects={projects} />
          </>
        )}

        {view === "avatars" && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">Avatars</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Start a new project with an avatar
                </p>
              </div>
            </div>
            <DashboardAvatarsSection avatars={avatars} />
          </>
        )}
      </div>
    </div>
  );
}
