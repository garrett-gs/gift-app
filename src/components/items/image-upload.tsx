"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, ScanSearch, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onProductIdentified?: (product: {
    name?: string;
    price?: number;
    url?: string;
  }) => void;
}

export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onProductIdentified,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentImageUrl || null);
  const [lensUrl, setLensUrl] = useState<string | null>(null);
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

    const publicUrl = urlData.publicUrl;
    setUploadedUrl(publicUrl);
    onImageUploaded(publicUrl);

    // Auto-identify the product
    if (onProductIdentified) {
      identifyProduct(publicUrl);
    }
  }

  async function identifyProduct(imageUrl: string) {
    setIdentifying(true);
    setLensUrl(null);

    try {
      const res = await fetch("/api/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.searchUrl) {
          setLensUrl(data.searchUrl);
        }
        if (data.found && onProductIdentified) {
          onProductIdentified({
            name: data.name || undefined,
            price: data.price || undefined,
            url: data.url || undefined,
          });
        }
      }
    } catch {
      // Silently fail
    }

    setIdentifying(false);
  }

  function handleRemove() {
    setPreview(null);
    setUploadedUrl(null);
    setLensUrl(null);
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
            className="absolute right-2 top-2 z-10"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>

          {/* Identify / Google Lens buttons */}
          {uploadedUrl && onProductIdentified && (
            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
              {identifying ? (
                <div className="flex items-center gap-2 rounded-md bg-black/70 px-3 py-1.5 text-xs text-white">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Identifying product...
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    size="xs"
                    className="gap-1 bg-black/70 hover:bg-black/90 text-white border-0"
                    onClick={() => identifyProduct(uploadedUrl)}
                  >
                    <ScanSearch className="h-3 w-3" />
                    Identify
                  </Button>
                  {lensUrl && (
                    <a
                      href={lensUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white hover:bg-black/90"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Google Lens
                    </a>
                  )}
                </>
              )}
            </div>
          )}
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
