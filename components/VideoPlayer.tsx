"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  onDownload?: () => void;
}

export function VideoPlayer({ videoUrl, onDownload }: VideoPlayerProps) {
  return (
    <div className="space-y-6">
      <div className="aspect-[9/16] w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-black border border-white/10 shadow-2xl shadow-blue-900/20 relative group">
        <video
          src={videoUrl}
          controls
          className="h-full w-full object-contain"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
      {onDownload && (
        <div className="flex justify-center">
          <Button onClick={onDownload} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
            <Download className="mr-2 h-4 w-4" />
            Download Video
          </Button>
        </div>
      )}
    </div>
  );
}
