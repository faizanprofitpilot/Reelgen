"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
  existingFiles?: File[];
}

export function UploadDropzone({
  maxFiles = 5,
  onFilesChange,
  existingFiles = [],
}: UploadDropzoneProps) {
  const [files, setFiles] = useState<File[]>(existingFiles);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles).slice(0, maxFiles - files.length);
      const updatedFiles = [...files, ...fileArray].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, maxFiles, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback(
    (index: number) => {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, onFilesChange]
  );

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "border-2 border-dashed border-white/10 p-12 text-center transition-all duration-300 bg-white/5",
          isDragging && "border-blue-500 bg-blue-500/10",
          files.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          multiple
          disabled={files.length >= maxFiles}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <label
          htmlFor="file-upload"
          className={cn(
            "cursor-pointer flex flex-col items-center justify-center gap-4",
            files.length >= maxFiles && "cursor-not-allowed"
          )}
        >
          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
            <UploadCloud className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {maxFiles === 1
                ? `${files.length ? "1" : "0"} image (JPG, PNG)`
                : `${files.length} / ${maxFiles} files (JPG, PNG)`}
            </p>
          </div>
        </label>
      </Card>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <Card key={index} className="relative group border-white/10 bg-black/40">
              <div className="aspect-square w-full overflow-hidden rounded-md">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
