"use client";

import { useState, useMemo } from "react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { AvatarPicker } from "@/components/AvatarPicker";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Avatar, Duration, Pace, CaptionStyle } from "@/types/project";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface CreateStep2BuilderProps {
  avatars: Avatar[];
  productImages: File[];
  onProductImagesChange: (files: File[]) => void;
  selectedAvatarId?: string;
  onAvatarSelect: (avatarId: string) => void;
  script: string;
  onScriptChange: (script: string) => void;
  duration: Duration;
  onDurationChange: (duration: Duration) => void;
  pace: Pace;
  onPaceChange: (pace: Pace) => void;
  captionStyle: CaptionStyle;
  onCaptionStyleChange: (style: CaptionStyle) => void;
  extraInstructions: string;
  onExtraInstructionsChange: (instructions: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const scriptLimits: Record<Duration, { min: number; max: number }> = {
  3: { min: 15, max: 35 },
  5: { min: 30, max: 60 },
  8: { min: 50, max: 110 },
  10: { min: 70, max: 140 },
  15: { min: 100, max: 200 },
};

export function CreateStep2Builder({
  avatars,
  productImages,
  onProductImagesChange,
  selectedAvatarId,
  onAvatarSelect,
  script,
  onScriptChange,
  duration,
  onDurationChange,
  pace,
  onPaceChange,
  captionStyle,
  onCaptionStyleChange,
  extraInstructions,
  onExtraInstructionsChange,
  onBack,
  onNext,
}: CreateStep2BuilderProps) {
  const scriptLength = script.length;
  const limits = scriptLimits[duration];
  const isScriptValid = scriptLength >= limits.min && scriptLength <= limits.max;
  const scriptWarning = scriptLength > limits.max;

  const canProceed =
    productImages.length > 0 &&
    selectedAvatarId &&
    script.trim().length > 0 &&
    isScriptValid;

  return (
    <div className="space-y-10">
      {/* Product Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30">1</span>
          Product Image
        </h3>
        <UploadDropzone
          maxFiles={1}
          onFilesChange={onProductImagesChange}
          existingFiles={productImages}
        />
        <p className="text-xs text-muted-foreground">
          Use a clear product shot with a clean background for best results.
        </p>
      </div>

      {/* Avatar Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30">2</span>
          Choose Avatar
        </h3>
        <AvatarPicker
          avatars={avatars}
          selectedId={selectedAvatarId}
          onSelect={onAvatarSelect}
        />
      </div>

      {/* Script */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30">3</span>
            Script
          </h3>
          <span
            className={`text-sm ${
              scriptWarning
                ? "text-red-400"
                : isScriptValid
                ? "text-green-400"
                : "text-muted-foreground"
            }`}
          >
            {scriptLength} / {limits.min}-{limits.max} characters
          </span>
        </div>
        <Textarea
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          placeholder="Write your script here..."
          rows={6}
          className="bg-black/20 border-white/10 focus:border-blue-500/50"
        />
        {scriptWarning && (
          <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
            Script is too long for {duration}s video. Consider trimming it.
          </p>
        )}
        {script.length > 0 && !isScriptValid && script.length < limits.min && (
          <p className="text-sm text-yellow-400 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
            Script is too short. Aim for {limits.min}-{limits.max} characters for a{" "}
            {duration}s video.
          </p>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30">4</span>
          Video Settings
        </h3>
        <div className="grid md:grid-cols-3 gap-6 p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Duration</label>
            <Select
              value={duration.toString()}
              onChange={(e) => onDurationChange(Number(e.target.value) as Duration)}
            >
              <option value="3">3 seconds</option>
              <option value="5">5 seconds</option>
              <option value="8">8 seconds</option>
              <option value="10">10 seconds</option>
              <option value="15">15 seconds</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Pace</label>
            <Select value={pace} onChange={(e) => onPaceChange(e.target.value as Pace)}>
              <option value="fast">Fast</option>
              <option value="normal">Normal</option>
              <option value="slow">Slow</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Caption Style</label>
            <Select
              value={captionStyle}
              onChange={(e) => onCaptionStyleChange(e.target.value as CaptionStyle)}
            >
              <option value="bold">Bold</option>
              <option value="minimal">Minimal</option>
              <option value="clean">Clean</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Extra Instructions */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Additional Instructions (Optional)</label>
        <Textarea
          value={extraInstructions}
          onChange={(e) => onExtraInstructionsChange(e.target.value)}
          placeholder="Any additional instructions for video generation..."
          rows={3}
          className="bg-black/20 border-white/10"
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="border-white/10 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="bg-blue-600 hover:bg-blue-500 text-white px-8">
          Next Step
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
