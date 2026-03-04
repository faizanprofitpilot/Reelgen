"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StudioControlsPanel } from "@/components/studio/StudioControlsPanel";
import { StudioPreviewPanel } from "@/components/studio/StudioPreviewPanel";
import { buildGenerationPayload, validateStudioState } from "@/lib/studio-utils";
import { DEFAULT_STUDIO_STATE, type StudioState } from "@/types/studio";
import type { Avatar } from "@/types/project";
import Link from "next/link";
import { CUSTOM_AVATAR_STORAGE_KEY } from "@/components/DashboardAvatarsSection";

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [state, setState] = useState<StudioState>(DEFAULT_STUDIO_STATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

  const update = useCallback(
    <K extends keyof StudioState>(key: K, value: StudioState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Load avatars on mount
  useEffect(() => {
    async function loadData() {
      const { data: avatarsData } = await supabase.from("avatars").select("*");
      if (avatarsData) setAvatars(avatarsData);
    }
    loadData();
  }, [supabase]);

  // Load billing/credits on mount
  useEffect(() => {
    async function loadBilling() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("credits_balance, subscription_plan")
        .eq("id", user.id)
        .maybeSingle();

      setCreditsBalance(data?.credits_balance ?? 0);
      setSubscriptionPlan(data?.subscription_plan ?? null);
    }

    loadBilling();
  }, [supabase]);

  // Pre-select avatar from ?avatarId= when coming from dashboard Avatars section
  useEffect(() => {
    const avatarId = searchParams.get("avatarId");
    if (avatarId && avatars.some((a) => a.id === avatarId)) {
      setState((prev) => ({ ...prev, avatarId }));
    }
  }, [searchParams, avatars]);

  // Restore custom avatar from Avatars section "Upload your own" (stored in sessionStorage)
  useEffect(() => {
    if (searchParams.get("customAvatar") !== "1" || avatars.length === 0) return;
    const dataUrl = sessionStorage.getItem(CUSTOM_AVATAR_STORAGE_KEY);
    if (!dataUrl) return;
    const customAvatar = avatars.find((a) => a.name === "Custom");
    if (!customAvatar) return;
    try {
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] ?? "image/jpeg";
      const bstr = atob(arr[1] ?? "");
      const u8arr = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
      const file = new File([u8arr], "avatar.jpg", { type: mime });
      setState((prev) => ({
        ...prev,
        avatarId: customAvatar.id,
        customAvatarFile: file,
      }));
    } finally {
      sessionStorage.removeItem(CUSTOM_AVATAR_STORAGE_KEY);
    }
  }, [searchParams, avatars]);

  // ----------------------------------------------------------
  // Generate handler — identical flow to the original 3-step
  // ----------------------------------------------------------
  const handleGenerate = async () => {
    const error = validateStudioState(state);
    if (error) {
      alert(error);
      return;
    }

    // Fast client-side check to avoid uploads when credits are insufficient.
    // Server is the source of truth and will also enforce this.
    const creditsCost = state.durationSeconds;
    if (creditsBalance != null && creditsBalance < creditsCost) {
      alert(`Not enough credits. You need ${creditsCost}, but you have ${creditsBalance}.`);
      return;
    }

    setIsGenerating(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("You must be signed in to create a project.");
        setIsGenerating(false);
        return;
      }

      // 1. Build the exact payload the DB expects (use Custom avatar id when user uploaded their own)
      const customAvatar = avatars.find((a) => a.name === "Custom");
      const avatarId =
        state.customAvatarFile && customAvatar ? customAvatar.id : state.avatarId;
      const payload = buildGenerationPayload(state, { avatarId });

      // 2. Insert project record (user_id required for RLS)
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

      if (projectError) throw projectError;

      // 3. Upload product images
      const formData = new FormData();
      formData.append("projectId", project.id);
      state.productImages.forEach((file) => {
        formData.append("files", file);
      });

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload images");
      const { paths } = await uploadResponse.json();

      // 4. Create project_assets records
      for (const path of paths) {
        await supabase.from("project_assets").insert({
          project_id: project.id,
          type: "product_image",
          path,
        });
      }

      // 4b. If user uploaded custom avatar, upload it and set custom_avatar_path
      if (state.customAvatarFile) {
        const avatarForm = new FormData();
        avatarForm.append("file", state.customAvatarFile);
        const avatarRes = await fetch(`/api/projects/${project.id}/avatar`, {
          method: "POST",
          body: avatarForm,
        });
        if (!avatarRes.ok) throw new Error("Failed to upload custom avatar");
      }

      // 5. Trigger generation
      const response = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 402) {
          const body = await response.json().catch(() => ({}));
          const required = body?.required ?? state.durationSeconds;
          const balance = body?.balance ?? creditsBalance ?? 0;
          alert(`Insufficient credits. Need ${required}, have ${balance}.`);
          setIsGenerating(false);
          return;
        }
        throw new Error("Failed to start generation");
      }

      // 6. Redirect to project page for polling
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Failed to create project. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/Reelgen new logo.png" alt="Reelgen" className="h-9 w-9 shrink-0 rounded-lg object-contain align-middle" />
            <span className="text-lg font-semibold text-white leading-none">Reelgen</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-xs">Credits</span>
              <span className="text-xs font-semibold text-white tabular-nums">
                {creditsBalance ?? "—"}
              </span>
              {subscriptionPlan ? (
                <span className="text-[10px] text-muted-foreground">({subscriptionPlan})</span>
              ) : null}
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-white transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-5xl lg:max-w-6xl">
        <div className="grid lg:grid-cols-[1fr,320px] gap-10">
          <div className="min-w-0 order-2 lg:order-1">
            <StudioControlsPanel state={state} update={update} avatars={avatars} />
          </div>
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-20 lg:self-start">
              <StudioPreviewPanel
                state={state}
                avatars={avatars}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                creditsBalance={creditsBalance}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReelStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CreatePageContent />
    </Suspense>
  );
}
