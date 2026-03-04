import type { Pace, CaptionStyle } from "@/types/project";

// ---------------------------------------------------------------------------
// Presentation modes for Kling video generation
// ---------------------------------------------------------------------------
export type PresentationMode = "NARRATION" | "PRESENTATION" | "DIRECT_SPEAKING";

export const PRESENTATION_MODES = [
  { id: "NARRATION" as const, name: "Narration", description: "Natural voiceover style, lip sync not required" },
  { id: "PRESENTATION" as const, name: "Presentation", description: "Product showcase with gestures, background narration feel" },
  { id: "DIRECT_SPEAKING" as const, name: "Direct Speaking", description: "Close-up with synchronized lip movements" },
];

// ---------------------------------------------------------------------------
// Structure presets — UI-level concept that maps to existing DB template IDs
// ---------------------------------------------------------------------------
export interface StructurePreset {
  id: string;
  name: string;
  description: string;
  templateId: string;
}

export const STRUCTURE_PRESETS: StructurePreset[] = [
  { id: "testimonial", name: "Testimonial", description: "Authentic first-person endorsement", templateId: "testimonial_ugc" },
  { id: "problem-solution-cta", name: "Problem → Solution → CTA", description: "Hook with a pain point, demo the fix, close with CTA", templateId: "hook_problem_demo" },
  { id: "before-after", name: "Before / After", description: "Show the transformation your product creates", templateId: "hook_problem_demo" },
];

// ---------------------------------------------------------------------------
// Dropdown option lists
// ---------------------------------------------------------------------------
export const VIBE_OPTIONS = ["Friendly", "Confident", "Calm"] as const;
export const CAPTION_STYLE_OPTIONS = ["bold", "clean"] as const;

// ---------------------------------------------------------------------------
// Studio state — with presentation modes
// ---------------------------------------------------------------------------
export interface StudioState {
  // Presentation mode
  presentationMode: PresentationMode;
  
  // Core fields
  structurePreset: string;
  avatarId: string;
  /** When set, user uploaded their own avatar image; use this file and Custom avatar_id for project */
  customAvatarFile: File | null;
  durationSeconds: number; // 3-15 seconds
  pace: Pace;
  captionStyle: CaptionStyle;

  // Images
  productImages: File[];

  // Avatar section
  vibe: string;

  // Script/Content
  productName: string;
  benefits: string; // Description and benefits (single text)
  transcript: string; // Optional override

  // Style section
  /** When true, use customPrompt instead of preset-based Kling prompt */
  useCustomPrompt: boolean;
  customPrompt: string;
  subtitles: boolean;

  // Branding
  logo: File | null;
  ctaText: string;
}

export const DEFAULT_STUDIO_STATE: StudioState = {
  presentationMode: "NARRATION",
  
  structurePreset: "testimonial",
  avatarId: "",
  customAvatarFile: null,
  durationSeconds: 10,
  pace: "normal",
  captionStyle: "clean",
  productImages: [],

  vibe: "Friendly",

  productName: "",
  benefits: "",
  transcript: "",

  useCustomPrompt: false,
  customPrompt: "",
  subtitles: true,

  logo: null,
  ctaText: "",
};
