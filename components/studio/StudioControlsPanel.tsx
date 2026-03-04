"use client";

import { useState, useEffect, useMemo } from "react";
import { AvatarPickerModal } from "@/components/studio/AvatarPickerModal";
import { UploadDropzone } from "@/components/UploadDropzone";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, ChevronDown, ChevronRight, Info } from "lucide-react";

import type { Avatar } from "@/types/project";
import type { StudioState } from "@/types/studio";
import { PRESENTATION_MODES } from "@/types/studio";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </label>
  );
}

interface StudioControlsPanelProps {
  state: StudioState;
  update: <K extends keyof StudioState>(key: K, value: StudioState[K]) => void;
  avatars: Avatar[];
}

export function StudioControlsPanel({ state, update, avatars }: StudioControlsPanelProps) {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [scriptExpanded, setScriptExpanded] = useState(false);

  const customAvatar = avatars.find((a) => a.name === "Custom");
  const selectedAvatar = state.customAvatarFile
    ? null
    : avatars.find((a) => a.id === state.avatarId);
  const customPreviewUrl = useMemo(() => {
    if (!state.customAvatarFile) return null;
    return URL.createObjectURL(state.customAvatarFile);
  }, [state.customAvatarFile]);

  useEffect(() => {
    return () => {
      if (customPreviewUrl) URL.revokeObjectURL(customPreviewUrl);
    };
  }, [customPreviewUrl]);

  const handleSelectAvatar = (id: string) => {
    update("avatarId", id);
    update("customAvatarFile", null);
  };

  const handleSelectCustom = (file: File) => {
    if (customAvatar) update("avatarId", customAvatar.id);
    update("customAvatarFile", file);
  };

  return (
    <div className="space-y-6">
      <AvatarPickerModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        avatars={avatars}
        selectedId={state.avatarId || undefined}
        onSelect={handleSelectAvatar}
        onSelectCustom={handleSelectCustom}
      />

      {/* Card 1: Avatar */}
      <Card className="rounded-xl border border-white/10 bg-white/[0.02] p-5 shadow-none">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          1. Avatar
        </p>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-lg overflow-hidden bg-white/5 shrink-0">
            {state.customAvatarFile && customPreviewUrl ? (
              <img
                src={customPreviewUrl}
                alt="Your avatar"
                className="h-full w-full object-cover"
              />
            ) : selectedAvatar ? (
              <img
                src={selectedAvatar.image_path}
                alt={selectedAvatar.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-6 w-6 text-white/30" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {state.customAvatarFile ? "My avatar" : selectedAvatar ? selectedAvatar.name : "No avatar selected"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => setAvatarModalOpen(true)}
            >
              Change
            </Button>
          </div>
        </div>
      </Card>

      {/* Card 2: Product & Message */}
      <Card className="rounded-xl border border-white/10 bg-white/[0.02] p-5 shadow-none">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          2. Product & Message
        </p>
        <div className="space-y-4">
          <div>
            <FieldLabel>Product image</FieldLabel>
            <UploadDropzone
              maxFiles={1}
              onFilesChange={(files) => update("productImages", files)}
              existingFiles={state.productImages}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Use a clear product shot with a clean background for best results.
            </p>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Product name</FieldLabel>
            <Input
              value={state.productName}
              onChange={(e) => update("productName", e.target.value)}
              placeholder="e.g. Hydra Glow Serum"
              className="bg-white/5 border-white/10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Description and benefits</FieldLabel>
            <Textarea
              value={state.benefits}
              onChange={(e) => update("benefits", e.target.value)}
              placeholder="e.g. Reduces wrinkles in 7 days, 24h hydration, dermatologist approved..."
              rows={3}
              className="bg-white/5 border-white/10 text-sm resize-none"
            />
          </div>

          {/* Optional: Script override (collapsed by default) */}
          <div className="border-t border-white/5 pt-4">
            <button
              type="button"
              className="flex w-full items-center justify-between py-1 text-sm text-muted-foreground hover:text-white"
              onClick={() => setScriptExpanded((v) => !v)}
            >
              <span className="flex items-center gap-1.5">
                Optional: Script override
                <span
                  className="group relative shrink-0 cursor-help opacity-80 hover:opacity-100 inline-flex"
                  aria-label="Script override: write the exact words you want the avatar to say. Leave blank to auto-generate from your product and benefits."
                  onClick={(e) => e.stopPropagation()}
                >
                  <Info className="h-3.5 w-3.5" />
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-1.5 text-xs font-normal text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-none">
                    Write the exact words you want the avatar to say. Leave blank to auto-generate from your product and benefits.
                  </span>
                </span>
              </span>
              {scriptExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {scriptExpanded && (
              <div className="mt-3">
                <Textarea
                  value={state.transcript}
                  onChange={(e) => update("transcript", e.target.value)}
                  placeholder="Leave blank to auto-generate from product & benefits..."
                  rows={4}
                  className="bg-white/5 border-white/10 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Card 3: Style */}
      <Card className="rounded-xl border border-white/10 bg-white/[0.02] p-5 shadow-none">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          3. Style
        </p>
        <div className="space-y-4">
          <div>
            <FieldLabel>Prompt</FieldLabel>
            <div className="mt-2 flex rounded-lg bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => update("useCustomPrompt", false)}
                className={cn(
                  "flex-1 rounded-md py-2 px-3 text-xs font-medium transition-colors",
                  !state.useCustomPrompt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
                )}
              >
                Use presets
              </button>
              <button
                type="button"
                onClick={() => update("useCustomPrompt", true)}
                className={cn(
                  "flex-1 rounded-md py-2 px-3 text-xs font-medium transition-colors",
                  state.useCustomPrompt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
                )}
              >
                Custom prompt
              </button>
            </div>
          </div>

          {state.useCustomPrompt ? (
            <div>
              <FieldLabel>Your prompt</FieldLabel>
              <Textarea
                value={state.customPrompt}
                onChange={(e) => update("customPrompt", e.target.value)}
                placeholder="E.g. Vertical 9:16 UGC-style video. Creator holds the product in hand, natural daylight, casual talking to camera. Product clearly visible for first 3 seconds, then demo in use. Friendly, authentic tone. No text overlays. Phone-shot aesthetic."
                rows={5}
                className="mt-2 bg-white/5 border-white/10 text-sm placeholder:text-gray-500 resize-y min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Tip: Describe framing (vertical 9:16), how the product is shown, lighting, mood, and what the creator does. Be specific for best product-in-hand UGC results.
              </p>
            </div>
          ) : (
            <div>
              <FieldLabel>Presentation mode</FieldLabel>
              <div className="mt-2 flex rounded-lg bg-white/5 p-1 border border-white/10">
              {PRESENTATION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => update("presentationMode", mode.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 px-3 text-xs font-medium transition-colors min-w-0",
                    state.presentationMode === mode.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <span>{mode.name}</span>
                  <span
                    className="relative shrink-0 cursor-help opacity-80 hover:opacity-100 group inline-flex"
                    aria-label={mode.description}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-1.5 text-xs font-normal text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition-none">
                      {mode.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <FieldLabel>Duration</FieldLabel>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={1}
                  value={state.durationSeconds}
                  onChange={(e) => update("durationSeconds", parseInt(e.target.value))}
                  className="flex-1 min-w-0 slider"
                />
                <span className="text-sm font-medium text-white tabular-nums w-8 shrink-0">{state.durationSeconds}s</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                This reel will use <span className="text-white/90 font-medium">{state.durationSeconds}</span> credits.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
