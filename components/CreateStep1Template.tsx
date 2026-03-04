"use client";

import { TemplateCard } from "@/components/TemplateCard";
import { Button } from "@/components/ui/button";
import type { Template } from "@/types/project";
import { ArrowRight } from "lucide-react";

interface CreateStep1TemplateProps {
  templates: Template[];
  selectedTemplateId?: string;
  onSelect: (templateId: string) => void;
  onNext: () => void;
}

export function CreateStep1Template({
  templates,
  selectedTemplateId,
  onSelect,
  onNext,
}: CreateStep1TemplateProps) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-muted-foreground text-lg">
          Select a high-converting template optimized for social media engagement.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            id={template.id}
            name={template.name}
            description={template.description}
            previewUrl={template.preview_url}
            selected={selectedTemplateId === template.id}
            onClick={() => onSelect(template.id)}
          />
        ))}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!selectedTemplateId}
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 text-white px-8"
        >
          Next Step
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
