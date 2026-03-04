"use client";

import { useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, User, ImageIcon } from "lucide-react";

import type { Avatar } from "@/types/project";
import type { StudioState } from "@/types/studio";
import { PRESENTATION_MODES } from "@/types/studio";
import { validateStudioState } from "@/lib/studio-utils";

interface StudioPreviewPanelProps {
  state: StudioState;
  avatars: Avatar[];
  onGenerate: () => void;
  isGenerating: boolean;
  creditsBalance?: number | null;
}

export function StudioPreviewPanel({
  state,
  avatars,
  onGenerate,
  isGenerating,
  creditsBalance,
}: StudioPreviewPanelProps) {
  const selectedAvatar = avatars.find((a) => a.id === state.avatarId);
  const customPreviewUrl = useMemo(
    () => (state.customAvatarFile ? URL.createObjectURL(state.customAvatarFile) : null),
    [state.customAvatarFile]
  );
  useEffect(() => {
    return () => {
      if (customPreviewUrl) URL.revokeObjectURL(customPreviewUrl);
    };
  }, [customPreviewUrl]);
  const mode = PRESENTATION_MODES.find((m) => m.id === state.presentationMode);
  const validationError = validateStudioState(state);
  const creditsRequired = state.durationSeconds;
  const creditsError =
    creditsBalance != null && creditsBalance < creditsRequired
      ? `Not enough credits. You need ${creditsRequired}, but you have ${creditsBalance}.`
      : null;
  const canGenerate = !validationError && !creditsError && !isGenerating;
  const avatarPreviewSrc = customPreviewUrl ?? selectedAvatar?.image_path;
  const avatarLabel = state.customAvatarFile ? "My avatar" : selectedAvatar?.name;

  return (
    <div className="flex flex-col gap-6">
      {/* Preview card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Preview
          </p>
        </div>
        <div className="aspect-[9/16] w-full max-w-[280px] mx-auto bg-gradient-to-b from-white/5 to-transparent flex flex-col items-center justify-center p-6 gap-4">
          {isGenerating ? (
            <>
              <div className="robot-waiting flex flex-col items-center gap-3">
                <svg
                  className="w-20 h-20 text-primary/80"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <rect x="12" y="20" width="40" height="32" rx="6" className="fill-current opacity-90" />
                  <rect x="20" y="28" width="10" height="10" rx="2" className="fill-background animate-robot-blink" style={{ animationDelay: "0s" }} />
                  <rect x="34" y="28" width="10" height="10" rx="2" className="fill-background animate-robot-blink" style={{ animationDelay: "0.5s" }} />
                  <rect x="26" y="44" width="12" height="4" rx="2" className="fill-background opacity-80" />
                  <rect x="28" y="8" width="8" height="12" rx="2" className="fill-current opacity-70" />
                  <circle cx="32" cy="6" r="2" className="fill-cyan-400 animate-pulse" />
                </svg>
                <div className="w-full max-w-[200px] h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary to-cyan-400 animate-loading-bar" />
                </div>
              </div>
              <p className="text-sm font-medium text-white text-center">
                Generating your reel…
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-[220px]">
                This usually takes 5–6 minutes. You can leave this page — we&apos;ll save your video when it&apos;s ready.
              </p>
            </>
          ) : (
            <>
              {(avatarPreviewSrc || selectedAvatar) ? (
                <div className="h-20 w-20 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
                  <img
                    src={avatarPreviewSrc}
                    alt={avatarLabel ?? "Avatar"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <User className="h-8 w-8 text-white/20" />
                </div>
              )}
              {state.productImages.length > 0 ? (
                <div className="flex gap-2 flex-wrap justify-center">
                  {state.productImages.slice(0, 3).map((file, i) => (
                    <div
                      key={i}
                      className="h-12 w-12 rounded-lg overflow-hidden bg-white/5 border border-white/10"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-12 w-12 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-white/20" />
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">
                {(selectedAvatar || state.customAvatarFile) && state.productImages.length > 0
                  ? "Ready to generate"
                  : "Select avatar & product images"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={cn(
            "w-full h-11 rounded-lg font-medium",
            canGenerate
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-white/10 text-muted-foreground cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating… (5–6 min)
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Reel
            </span>
          )}
        </Button>
        {validationError ? (
          <p className="text-xs text-center text-amber-400/90">{validationError}</p>
        ) : creditsError ? (
          <p className="text-xs text-center text-amber-400/90">{creditsError}</p>
        ) : null}
      </div>

      {/* One-line summary chips */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-muted-foreground">
          {mode?.name ?? "—"}
        </span>
        <span className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-muted-foreground">
          {state.durationSeconds}s
        </span>
        <span className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-muted-foreground">
          {state.subtitles ? state.captionStyle : "No captions"}
        </span>
      </div>
    </div>
  );
}
