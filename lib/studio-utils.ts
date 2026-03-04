import { STRUCTURE_PRESETS, type StudioState, type PresentationMode } from "@/types/studio";

// ---------------------------------------------------------------------------
// Kling Prompt Builder — Mode-aware prompt construction
// ---------------------------------------------------------------------------

/**
 * Mode A: Narration
 * Natural voiceover style, lip sync not required, allow wider framing and natural motion.
 */
function getModeBlockNarration(): string {
  return "Narration style: natural voiceover delivery, lip sync not critical, allow natural body language and slight movement, medium to medium-wide framing, authentic UGC feel.";
}

/**
 * Mode B: Presentation
 * Product showcase with gestures, background narration feel, lip sync not required.
 */
function getModeBlockPresentation(): string {
  return "Presentation style: prioritize product showcase, allow gestures and pointing, audio can feel like background narration or voiceover, lip sync not required, product visible throughout, medium framing with product emphasis.";
}

/**
 * Mode C: Direct Speaking
 * Close-up with perfect lip sync to the script.
 */
function getModeBlockDirectSpeaking(): string {
  return (
    "Direct speaking style: medium close-up framing, authentic eye contact with camera. " +
    "Perfect lip sync required: mouth movements must match the spoken words exactly, frame-by-frame synchronization of lips to the dialogue, precise word-by-word articulation so that every syllable is clearly reflected in lip movement. " +
    "Minimal body movement so focus stays on face and lip sync; clear facial expressions."
  );
}

function getModeBlock(mode: PresentationMode): string {
  switch (mode) {
    case "NARRATION":
      return getModeBlockNarration();
    case "PRESENTATION":
      return getModeBlockPresentation();
    case "DIRECT_SPEAKING":
      return getModeBlockDirectSpeaking();
  }
}

/**
 * Duration-aware pacing constraints
 * - 3-5s: very short, minimal movement, tight pacing
 * - 6-10s: normal pacing, moderate movement
 * - 11-15s: slower pacing, minimal movement, avoid fast gestures
 */
function getDurationBlock(seconds: number): string {
  if (seconds <= 5) {
    return "Duration pacing: very short clip (3-5s), minimal movement, tight pacing, quick delivery, no elaborate gestures.";
  } else if (seconds <= 10) {
    return "Duration pacing: normal length (6-10s), moderate movement allowed, balanced pacing, natural delivery rhythm.";
  } else {
    return "Duration pacing: longer clip (11-15s), slower pacing, minimal movement, avoid fast gestures, deliberate delivery, maintain engagement without rushing.";
  }
}

/**
 * Script block: either inject transcript or provide content brief
 * Transcript is trimmed to fit duration so narration finishes before the video ends.
 */
const WORDS_PER_SECOND = 2.2; // Conservative so speech finishes before video cut

function parseBenefitsText(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((b) => b.trim())
    .filter(Boolean);
}

/** Trim script to max words that can be spoken within durationSeconds so it finishes before the video ends. */
function trimScriptToDuration(script: string, durationSeconds: number): string {
  const maxWords = Math.floor(durationSeconds * WORDS_PER_SECOND);
  const words = script.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return script.trim();
  return words.slice(0, maxWords).join(" ");
}

function getScriptBlock(state: StudioState): string {
  if (state.transcript && state.transcript.trim()) {
    const trimmed = trimScriptToDuration(state.transcript, state.durationSeconds);
    const lipSyncNote =
      state.presentationMode === "DIRECT_SPEAKING"
        ? " Deliver with exact lip sync: mouth must match every word."
        : "";
    return (
      `Spoken dialogue (must be fully delivered within ${state.durationSeconds} seconds; narration must finish before the video ends—do not let speech run past the end of the clip): "${trimmed}"${lipSyncNote}`
    );
  } else {
    const benefitList = parseBenefitsText(state.benefits).slice(0, 3);
    const maxWords = Math.floor(state.durationSeconds * WORDS_PER_SECOND);
    return (
      `Generate spoken content that fits within ${state.durationSeconds} seconds. ` +
      `Use at most ${maxWords} words so delivery finishes before the video ends. ` +
      `Do not let speech or voiceover run past the end of the clip. ` +
      `Mention product name "${state.productName || "the product"}" once and 2-3 benefits from this list: ${benefitList.join(", ")}. ` +
      `Use simple, clear language.`
    );
  }
}

/**
 * Build the complete Kling prompt for video generation.
 *
 * Structure:
 * 1. CORE: Vertical 9:16, photorealistic UGC, reference images (any physical product)
 * 2. FRAME: Compose for portrait only; nothing requires landscape
 * 3. PRODUCT LOCK: product visibility, no warping (works for any handheld product)
 * 4. MODE BLOCK: Narration / Presentation / Direct Speaking (lip sync for speaking)
 * 5. DURATION BLOCK: pacing for 3-5 / 6-10 / 11-15s
 * 6. SCRIPT BLOCK: transcript or content brief
 * 7. FINAL CONSTRAINTS
 */
export function buildKlingPrompt(state: StudioState): string {
  const parts: string[] = [];

  // 1. CORE — vertical 9:16, any physical product
  parts.push(
    "Vertical 9:16 format only, photorealistic UGC-style video. " +
    "Use reference image 1 for person/avatar identity and environment exactly as shown. " +
    "Use reference image 2 for the product-in-hand exactly as shown (any physical product: bottle, device, package, supplement, cosmetic, electronics, etc.), maintaining its appearance and branding."
  );

  // 2. FRAME: compose for portrait — nothing needs landscape to be seen
  parts.push(
    "Compose strictly for vertical 9:16 portrait frame. " +
    "All action, the full product, and the person must fit entirely within the vertical frame. " +
    "Do not create compositions that require landscape or horizontal space to be fully visible; everything must read clearly in portrait orientation."
  );

  // 3. PRODUCT LOCK — works for any handheld product
  parts.push(
    "The product (whatever it is—held in hand, shown to camera) must be visible most of the time. " +
    "If the product has a label, keep it facing camera and readable when possible. " +
    "No product warping or distortion. " +
    "No extra products, logos, or text overlays. " +
    "No background changes from reference images."
  );

  // 4. MODE BLOCK
  parts.push(getModeBlock(state.presentationMode));

  // 5. DURATION BLOCK
  parts.push(getDurationBlock(state.durationSeconds));

  // 6. SCRIPT BLOCK
  parts.push(getScriptBlock(state));

  // 7. FINAL CONSTRAINTS
  parts.push(
    "Maintain temporal stability. " +
    "Natural lighting. " +
    "Handheld camera feel. " +
    "Authentic UGC aesthetic. " +
    "No uncanny valley effects. " +
    "Narration or spoken content must be fully delivered within the video length and must finish before the video ends; do not let speech or voiceover run past the end of the clip."
  );

  return parts.join(" ");
}

/**
 * Maps StudioState → the exact payload shape the `projects` table expects.
 * New UI fields that have no dedicated column are serialised into extra_instructions.
 * Pass options.avatarId when using a custom uploaded avatar (Custom avatar row id).
 */
export function buildGenerationPayload(
  state: StudioState,
  options?: { avatarId?: string }
) {
  const preset = STRUCTURE_PRESETS.find((p) => p.id === state.structurePreset);
  const templateId = preset?.templateId ?? "testimonial_ugc";

  const extras: string[] = [];

  // Serialize presentation mode and related metadata
  extras.push(`Presentation mode: ${state.presentationMode}`);
  extras.push(`Product: ${state.productName || "N/A"}`);
  extras.push(`Benefits: ${state.benefits.trim() || "N/A"}`);
  extras.push(`Transcript provided: ${state.transcript ? "Yes" : "No"}`);
  extras.push(`Duration: ${state.durationSeconds}s`);

  if (state.vibe !== "Friendly") extras.push(`Vibe: ${state.vibe}`);
  if (!state.subtitles) extras.push("No subtitles");
  if (state.ctaText) extras.push(`CTA: ${state.ctaText}`);

  if (state.useCustomPrompt && state.customPrompt.trim()) {
    extras.push("Custom prompt: Yes");
    extras.push(`<<<CUSTOM_PROMPT>>>${state.customPrompt.trim()}<<<END>>>`);
  } else {
    const klingPrompt = buildKlingPrompt(state);
    extras.push(`Kling prompt: ${klingPrompt}`);
  }

  return {
    template_id: templateId,
    avatar_id: options?.avatarId ?? state.avatarId,
    duration_seconds: state.durationSeconds,
    pace: state.pace,
    caption_style: state.captionStyle,
    script: state.transcript || `Generated from: ${state.productName}`,
    extra_instructions: extras.join(" | "),
    status: "DRAFT" as const,
  };
}

/**
 * Quick validation — returns an error string or null if ready to generate.
 */
export function validateStudioState(state: StudioState): string | null {
  if (!state.avatarId && !state.customAvatarFile) return "Select an avatar or upload your own";
  if (state.productImages.length === 0) return "Upload at least one product image";
  if (!state.productName.trim()) return "Enter a product name";
  
  if (!state.benefits.trim()) return "Add description and benefits";
  
  if (state.durationSeconds < 3 || state.durationSeconds > 15) {
    return "Duration must be between 3-15 seconds";
  }

  if (state.useCustomPrompt && !state.customPrompt.trim()) {
    return "Enter your custom prompt or switch back to presets";
  }
  if (state.useCustomPrompt && state.customPrompt.trim().length < 30) {
    return "Custom prompt should be at least 30 characters for best results";
  }
  
  return null;
}

/**
 * Local heuristic script generator — uses description/benefits text (newlines or commas).
 */
export function generateLocalScript(
  productName: string,
  benefits: string,
  structurePreset: string,
  durationSeconds: number
): string {
  const name = productName || "this product";
  const benefitList = parseBenefitsText(benefits);

  const parts: string[] = [];

  if (structurePreset === "problem-solution-cta" || structurePreset === "before-after") {
    parts.push(`Okay so, if you've been looking for a solution—`);
    if (benefitList.length > 0) {
      parts.push(`${name} actually ${benefitList[0]?.toLowerCase() || "works"}.`);
      if (benefitList.length > 1) parts.push(`Plus it ${benefitList[1]?.toLowerCase()}.`);
      if (benefitList.length > 2) parts.push(`And ${benefitList[2]?.toLowerCase()}.`);
    }
    parts.push("You need to try this.");
  } else if (structurePreset === "testimonial") {
    parts.push(`I have to be honest with you—I've been using ${name} for a while now.`);
    if (benefitList.length > 0) {
      parts.push(`It ${benefitList[0]?.toLowerCase() || "really helps"}.`);
      if (benefitList.length > 1) parts.push(`${benefitList[1]?.toLowerCase()}.`);
    }
    parts.push("Honestly, it's been a game changer. I'm never going back.");
  } else {
    parts.push(`Check out ${name}.`);
    if (benefitList.length > 0) {
      parts.push(`It ${benefitList.map((b) => b.toLowerCase()).join(", ")}.`);
    }
    parts.push("You need to try this.");
  }

  let script = parts.join(" ");

  // Rough trim to fit duration (130-160 wpm → ~2.5 words/sec)
  const maxWords = Math.round(durationSeconds * 2.5);
  const words = script.split(/\s+/);
  if (words.length > maxWords) {
    script = words.slice(0, maxWords).join(" ") + "...";
  }

  return script;
}

/**
 * Estimate script read time in seconds (130-160 wpm average).
 */
export function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / 145) * 10) / 10;
}
