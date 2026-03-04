import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProjectStatus = "DRAFT" | "QUEUED" | "GENERATING" | "COMPLETE" | "FAILED";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  QUEUED: { label: "Queued", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  GENERATING: { label: "Generating", className: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse" },
  COMPLETE: { label: "Complete", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  FAILED: { label: "Failed", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn(config.className, "border", className)}>
      {config.label}
    </Badge>
  );
}
