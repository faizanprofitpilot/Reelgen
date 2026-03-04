import type { Pace, CaptionStyle, Duration } from "@/types/project";

const GLOBAL_UGC_PROMPT = `UGC-style video, phone-shot vertical format (9:16 aspect ratio), handheld camera movement, natural lighting, realistic human presenter, authentic TikTok/Reels ad pacing, minimal uncanny valley effects, product clearly visible in frame, organic feel, genuine user-generated content aesthetic.`;

export interface BuildPromptParams {
  templateMaster: string;
  script: string;
  duration: Duration;
  pace: Pace;
  captionStyle: CaptionStyle;
  extraInstructions?: string;
  productName?: string;
  productDesc?: string;
}

export function buildKlingPrompt({
  templateMaster,
  script,
  duration,
  pace,
  captionStyle,
  extraInstructions,
  productName,
  productDesc,
}: BuildPromptParams): string {
  const parts: string[] = [];

  // Global UGC style
  parts.push(GLOBAL_UGC_PROMPT);

  // Template-specific master prompt
  parts.push(templateMaster);

  // Product context (if provided)
  if (productName || productDesc) {
    const productContext = [];
    if (productName) productContext.push(`Product: ${productName}`);
    if (productDesc) productContext.push(`Description: ${productDesc}`);
    parts.push(productContext.join(". "));
  }

  // User script
  parts.push(`Script/narration: "${script}"`);

  // Duration-based pacing (Duration = 3 | 5 | 8 | 10 | 15)
  const pacingInstructions: Record<Duration, Record<Pace, string>> = {
    3: {
      fast: "Very short clip, snappy pacing, hook immediately",
      normal: "Brief and clear, tight delivery",
      slow: "Short but deliberate, clear enunciation",
    },
    5: {
      fast: "Quick pacing, energetic, hook within first second",
      normal: "Compact pacing, clear delivery",
      slow: "Deliberate short clip, thoughtful delivery",
    },
    8: {
      fast: "Very fast pacing, quick cuts, energetic rhythm, hook within first 2 seconds",
      normal: "Moderate pacing, clear delivery, engaging rhythm",
      slow: "Deliberate pacing, clear enunciation, thoughtful delivery",
    },
    10: {
      fast: "Fast-paced, dynamic cuts, high energy",
      normal: "Steady pacing, natural flow, balanced rhythm",
      slow: "Relaxed pacing, comfortable delivery",
    },
    15: {
      fast: "Fast-paced editing, dynamic cuts every 2-3 seconds, high energy",
      normal: "Steady pacing, natural flow, balanced rhythm",
      slow: "Relaxed pacing, comfortable delivery, unhurried presentation",
    },
  };
  parts.push(pacingInstructions[duration][pace]);

  // Caption style hints
  const captionHints: Record<CaptionStyle, string> = {
    bold: "Bold text overlays, eye-catching typography, prominent captions",
    minimal: "Minimal text, subtle captions, clean typography",
    clean: "Clean text design, readable captions, professional typography",
  };
  parts.push(captionHints[captionStyle]);

  // Extra instructions (if provided)
  if (extraInstructions) {
    parts.push(`Additional instructions: ${extraInstructions}`);
  }

  return parts.join(". ");
}
