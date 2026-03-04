"use client";

import { useState, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Search, Maximize2, Upload } from "lucide-react";

interface Avatar {
  id: string;
  name: string;
  image_path: string;
}

interface AvatarPickerModalProps {
  open: boolean;
  onClose: () => void;
  avatars: Avatar[];
  selectedId: string | undefined;
  onSelect: (avatarId: string) => void;
  onSelectCustom?: (file: File) => void;
}

export function AvatarPickerModal({
  open,
  onClose,
  avatars,
  selectedId,
  onSelect,
  onSelectCustom,
}: AvatarPickerModalProps) {
  const [search, setSearch] = useState("");
  const [expandedAvatar, setExpandedAvatar] = useState<Avatar | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const predefinedAvatars = useMemo(() => avatars.filter((a) => a.name !== "Custom"), [avatars]);

  const filtered = useMemo(() => {
    if (!search.trim()) return predefinedAvatars;
    const q = search.trim().toLowerCase();
    return predefinedAvatars.filter((a) => a.name.toLowerCase().includes(q));
  }, [predefinedAvatars, search]);

  if (!open) return null;

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const MAX_AVATAR_SIZE = 25 * 1024 * 1024; // 25MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      alert("Image must be under 25MB. Please choose a smaller file.");
      e.target.value = "";
      return;
    }
    if (onSelectCustom) {
      onSelectCustom(file);
      onClose();
    }
    e.target.value = "";
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
        <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-base font-semibold text-white">Choose avatar</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search avatars..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {onSelectCustom && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Card
                  className="cursor-pointer transition-all duration-200 overflow-hidden border-2 border-dashed border-white/20 hover:border-primary/50 hover:bg-white/5 flex items-center justify-center gap-3 p-4"
                  onClick={handleUploadClick}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Upload your own avatar</span>
                </Card>
              </div>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filtered.map((avatar) => (
                <Card
                  key={avatar.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 overflow-hidden relative group",
                    "hover:ring-2 hover:ring-primary/50 hover:bg-white/5",
                    selectedId === avatar.id && "ring-2 ring-primary border-primary/50 bg-primary/10"
                  )}
                  onClick={() => handleSelect(avatar.id)}
                >
                  <div className="aspect-square w-full overflow-hidden bg-white/5 relative">
                    <img
                      src={avatar.image_path}
                      alt={avatar.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedAvatar(avatar);
                      }}
                      className="absolute bottom-1.5 right-1.5 p-1.5 rounded-md bg-black/60 text-white/90 hover:bg-black/80 hover:text-white transition-opacity opacity-70 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                      aria-label="Expand avatar"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-center py-2 font-medium text-gray-300 truncate px-1">
                    {avatar.name}
                  </p>
                </Card>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No avatars match your search.</p>
            )}
          </div>
        </div>
      </div>

      {/* Expanded image lightbox */}
      {expandedAvatar && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={() => setExpandedAvatar(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded avatar view"
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpandedAvatar(null)}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={expandedAvatar.image_path}
              alt={expandedAvatar.name}
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            />
            <p className="text-sm font-medium text-white mt-3">{expandedAvatar.name}</p>
            <Button
              type="button"
              className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleSelect(expandedAvatar.id)}
            >
              Select this avatar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
