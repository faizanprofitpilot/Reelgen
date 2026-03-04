"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Avatar {
  id: string;
  name: string;
  image_path: string;
}

interface AvatarPickerProps {
  avatars: Avatar[];
  selectedId?: string;
  onSelect: (avatarId: string) => void;
}

export function AvatarPicker({ avatars, selectedId, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
      {avatars.map((avatar) => (
        <Card
          key={avatar.id}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:bg-white/10 p-2 border-white/5",
            selectedId === avatar.id && "ring-2 ring-blue-500 border-blue-500/50 bg-blue-500/10"
          )}
          onClick={() => onSelect(avatar.id)}
        >
          <div className="aspect-square w-full overflow-hidden rounded-md bg-black/40">
            <img
              src={avatar.image_path}
              alt={avatar.name}
              className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <p className="text-xs text-center mt-2 font-medium text-gray-300">{avatar.name}</p>
        </Card>
      ))}
    </div>
  );
}
