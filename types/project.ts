export type ProjectStatus = "DRAFT" | "QUEUED" | "GENERATING" | "COMPLETE" | "FAILED";
export type Pace = "fast" | "normal" | "slow";
export type CaptionStyle = "bold" | "minimal" | "clean";
/** Supported video duration in seconds (3–15). Used for UI options. */
export type Duration = 3 | 5 | 8 | 10 | 15;

export interface Project {
  id: string;
  user_id: string;
  template_id: string;
  avatar_id: string;
  /** When set, generation uses this Storage path (avatars bucket) instead of avatars.image_path */
  custom_avatar_path?: string | null;
  status: ProjectStatus;
  /** Video length in seconds (3–15) */
  duration_seconds: number;
  pace: Pace;
  caption_style: CaptionStyle;
  script: string;
  extra_instructions?: string;
  video_path?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  master_prompt: string;
  preview_url?: string;
  caption_style: CaptionStyle;
  default_pace: Pace;
  created_at: string;
}

export interface Avatar {
  id: string;
  name: string;
  image_path: string;
  tags?: string[];
  created_at: string;
}

export interface ProjectAsset {
  id: string;
  project_id: string;
  type: "product_image";
  path: string;
  created_at: string;
}
