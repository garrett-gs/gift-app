"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
}

export function ImageUpload({ currentImageUrl, onImageUploaded }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("item-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploading(false);

    if (error) {
      console.error("Upload error:", error);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("item-images")
      .getPublicUrl(data.path);

    onImageUploaded(urlData.publicUrl);
  }

  function handleRemove() {
    setPreview(null);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      {preview ? (
        <div className="relative w-full">
          <img
            src={preview}
            alt="Item preview"
            className="h-48 w-full rounded-lg border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            className="absolute right-2 top-2"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors hover:bg-muted/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex gap-2 text-muted-foreground">
            <Camera className="h-5 w-5" />
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            {uploading ? "Uploading..." : "Take photo or upload image"}
          </p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
