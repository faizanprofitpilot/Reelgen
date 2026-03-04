"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import type { Avatar } from "@/types/project";

const CUSTOM_AVATAR_STORAGE_KEY = "reelgen_custom_avatar";
const MAX_CUSTOM_AVATAR_SIZE = 25 * 1024 * 1024; // 25MB
// sessionStorage is typically 5–10MB; base64 is ~1.37x file size — use 4MB so it fits
const SESSION_STORAGE_SAFE_SIZE = 4 * 1024 * 1024;

interface DashboardAvatarsSectionProps {
  avatars: Avatar[];
}

export function DashboardAvatarsSection({ avatars }: DashboardAvatarsSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const predefinedAvatars = avatars.filter((a) => a.name !== "Custom");

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_CUSTOM_AVATAR_SIZE) {
      alert("Image must be under 25MB. Please choose a smaller file.");
      e.target.value = "";
      return;
    }
    // Images over ~4MB exceed sessionStorage when stored as base64; send user to Create to pick file there
    if (file.size > SESSION_STORAGE_SAFE_SIZE) {
      router.push("/create?customAvatar=1");
      alert(
        "This image is too large to transfer from the dashboard (browser limit). On the Create page, click the avatar area → \"Choose avatar\" → \"Upload your own avatar\" to select your image. You can use images up to 25MB there."
      );
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        sessionStorage.setItem(CUSTOM_AVATAR_STORAGE_KEY, dataUrl);
        router.push("/create?customAvatar=1");
      } catch {
        alert(
          "Could not save image (browser storage limit). On the Create page, use \"Choose avatar\" → \"Upload your own avatar\" to select your image instead."
        );
      }
      e.target.value = "";
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (avatars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-muted-foreground">No avatars available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose an avatar to start a new project with that avatar pre-selected, or upload your own.
      </p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Card
          className="overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-white/[0.02] transition-all duration-200 hover:border-primary/50 hover:bg-white/[0.04] cursor-pointer"
          onClick={handleUploadClick}
        >
          <div className="aspect-square w-full bg-white/5 flex flex-col items-center justify-center gap-3 overflow-hidden p-4">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm font-medium text-white text-center">Upload your own avatar</span>
          </div>
          <CardContent className="p-4">
            <Button
              size="sm"
              className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/10"
              onClick={(e) => {
                e.stopPropagation();
                handleUploadClick();
              }}
            >
              <Upload className="h-3.5 w-3.5 mr-2" />
              Use my image
            </Button>
          </CardContent>
        </Card>
        {predefinedAvatars.map((avatar) => (
          <Card
            key={avatar.id}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="aspect-square w-full bg-white/5 flex items-center justify-center overflow-hidden">
              <img
                src={avatar.image_path}
                alt={avatar.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-white truncate mb-3">{avatar.name}</p>
              <Link href={`/create?avatarId=${encodeURIComponent(avatar.id)}`}>
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Create
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { CUSTOM_AVATAR_STORAGE_KEY };
