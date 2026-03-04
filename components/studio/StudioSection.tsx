"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioSectionProps {
  title: string;
  icon: ReactNode;
  defaultCollapsed?: boolean;
  children: ReactNode;
}

export function StudioSection({
  title,
  icon,
  defaultCollapsed = false,
  children,
}: StudioSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="text-blue-400">{icon}</span>
          <span className="text-sm font-semibold text-white">{title}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            collapsed && "-rotate-90"
          )}
        />
      </button>
      {!collapsed && (
        <div className="px-5 pb-5 pt-1 space-y-4">{children}</div>
      )}
    </div>
  );
}
