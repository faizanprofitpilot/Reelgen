"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Template, Avatar, Duration, Pace, CaptionStyle } from "@/types/project";
import { ArrowLeft, Sparkles } from "lucide-react";

interface CreateStep3ReviewProps {
  template: Template;
  avatar: Avatar;
  productImages: File[];
  script: string;
  duration: Duration;
  pace: Pace;
  captionStyle: CaptionStyle;
  extraInstructions?: string;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function CreateStep3Review({
  template,
  avatar,
  productImages,
  script,
  duration,
  pace,
  captionStyle,
  extraInstructions,
  onBack,
  onGenerate,
  isGenerating = false,
}: CreateStep3ReviewProps) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <p className="text-muted-foreground text-lg">
          Review your settings before generating your video.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:bg-white/5 transition-colors">
          <CardHeader>
            <CardTitle className="text-blue-400 text-lg">Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-white text-lg">{template.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          </CardContent>
        </Card>

        <Card className="hover:bg-white/5 transition-colors">
          <CardHeader>
            <CardTitle className="text-blue-400 text-lg">Avatar</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/40 border border-white/10">
              <img
                src={avatar.image_path}
                alt={avatar.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-white text-lg">{avatar.name}</p>
              <p className="text-sm text-muted-foreground">AI Presenter</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-white/5 transition-colors">
          <CardHeader>
            <CardTitle className="text-blue-400 text-lg">Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {productImages.map((file, i) => (
                <div key={i} className="w-12 h-12 rounded bg-black/40 border border-white/10 overflow-hidden">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>
            <p className="font-medium text-white mt-2">{productImages.length} image(s) selected</p>
          </CardContent>
        </Card>

        <Card className="hover:bg-white/5 transition-colors">
          <CardHeader>
            <CardTitle className="text-blue-400 text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium text-white">{duration}s</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-muted-foreground">Pace</span>
              <span className="font-medium text-white capitalize">{pace}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Caption Style</span>
              <span className="font-medium text-white capitalize">{captionStyle}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 hover:bg-white/5 transition-colors">
          <CardHeader>
            <CardTitle className="text-blue-400 text-lg">Script</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-gray-300 leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5">
              {script}
            </p>
          </CardContent>
        </Card>

        {extraInstructions && (
          <Card className="md:col-span-2 hover:bg-white/5 transition-colors">
            <CardHeader>
              <CardTitle className="text-blue-400 text-lg">Additional Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-300 bg-black/20 p-4 rounded-lg border border-white/5">
                {extraInstructions}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isGenerating} className="border-white/10 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating}
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          {isGenerating ? (
            <>Generating...</>
          ) : (
            <>
              Generate Video
              <Sparkles className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
