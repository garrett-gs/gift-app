"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/items/image-upload";
import { addItem } from "@/actions/items";

interface QuickAddItemProps {
  registries: {
    id: string;
    title: string;
    slug: string;
    occasion: string | null;
  }[];
  sharedUrl: string;
  sharedTitle: string;
}

export function QuickAddItem({
  registries,
  sharedUrl,
  sharedTitle,
}: QuickAddItemProps) {
  const [name, setName] = useState(sharedTitle);
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState(sharedUrl);
  const [imageUrl, setImageUrl] = useState("");
  const [registryId, setRegistryId] = useState(registries[0]?.id || "");
  const [pending, setPending] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Auto-fetch product details from shared URL
  useEffect(() => {
    if (sharedUrl && sharedUrl.startsWith("http")) {
      fetchFromUrl(sharedUrl);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchFromUrl(productUrl: string) {
    setFetching(true);
    try {
      const res = await fetch("/api/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        // Always overwrite with scraped data — this is the source of truth
        if (data.title) setName(data.title);
        if (data.price) setPrice(String(data.price));
        if (data.image) setImageUrl(data.image);
      }
    } catch {
      // Silently fail — user can still fill in manually
    }
    setFetching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!registryId) {
      setError("Please select a registry");
      return;
    }
    if (!name) {
      setError("Please enter an item name");
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("price", price);
    formData.set("url", url);
    formData.set("imageUrl", imageUrl);
    formData.set("priority", "3");
    formData.set("quantityDesired", "1");
    formData.set("currency", "USD");
    formData.set("category", "general");
    formData.set("size", "");

    const result = await addItem(registryId, formData);
    setPending(false);

    if (result.success) {
      setAdded(true);
      const reg = registries.find((r) => r.id === registryId);
      setTimeout(() => {
        router.push(`/registries/${reg?.slug || ""}`);
      }, 1500);
    } else {
      setError(result.error);
    }
  }

  if (added) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="rounded-full bg-green-100 p-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <p className="mt-4 text-lg font-semibold">Added to registry!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Redirecting to your registry...
        </p>
      </div>
    );
  }

  if (registries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center">
        <Gift className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-semibold">No registries yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a registry first, then you can add items to it.
        </p>
        <Button className="mt-4" onClick={() => router.push("/registries/new")}>
          Create Registry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Which registry */}
      <div className="space-y-2">
        <Label>Add to</Label>
        <Select value={registryId} onValueChange={(val) => setRegistryId(val || registryId)}>
          <SelectTrigger>
            <SelectValue placeholder="Select registry" />
          </SelectTrigger>
          <SelectContent>
            {registries.map((reg) => (
              <SelectItem key={reg.id} value={reg.id}>
                {reg.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {fetching && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Fetching product details...
          </span>
        </div>
      )}

      {/* Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="h-48 w-full rounded-lg border object-cover"
        />
      )}
      {!imageUrl && !fetching && (
        <ImageUpload
          onImageUploaded={setImageUrl}
          onProductIdentified={(product) => {
            if (product.name && !name) setName(product.name);
            if (product.price && !price) setPrice(String(product.price));
            if (product.url && !url) setUrl(product.url);
          }}
        />
      )}

      {/* Name */}
      <div className="space-y-1">
        <Label>What is it?</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          required
        />
      </div>

      {/* Price */}
      <div className="space-y-1">
        <Label>Price (optional)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* URL */}
      <div className="space-y-1">
        <Label>Link</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Product URL"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full h-12 text-base" disabled={pending}>
        {pending ? "Adding..." : "Add to Registry"}
      </Button>
    </form>
  );
}
