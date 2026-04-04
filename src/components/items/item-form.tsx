"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/items/image-upload";
import { BarcodeScanner } from "@/components/items/barcode-scanner";
import {
  PRIORITY_LABELS,
  ITEM_CATEGORIES,
  CLOTHING_SIZES,
  SHOE_SIZES,
} from "@/lib/constants";
import type { RegistryItem } from "@/lib/types";

interface ItemFormProps {
  item?: RegistryItem;
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  submitLabel: string;
  onSuccess?: () => void;
}

export function ItemForm({ item, action, submitLabel, onSuccess }: ItemFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [category, setCategory] = useState(
    (item as any)?.category || "general"
  );
  const [selectedSize, setSelectedSize] = useState(
    (item as any)?.size || ""
  );

  // Form field state for barcode auto-fill
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : "");
  const [url, setUrl] = useState(item?.url || "");

  const router = useRouter();

  const showSizes = category === "clothing";
  const showShoeSizes = category === "shoes";

  function handleProductFound(product: {
    name: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    url?: string;
  }) {
    if (product.name) setName(product.name);
    if (product.description) setDescription(product.description);
    if (product.price) setPrice(String(product.price));
    if (product.imageUrl) setImageUrl(product.imageUrl);
    if (product.url) setUrl(product.url);
  }

  async function handleSubmit(formData: FormData) {
    // Append values managed by state
    formData.set("imageUrl", imageUrl);
    formData.set("category", category);
    formData.set("size", selectedSize);

    setPending(true);
    setError(null);
    const result = await action(formData);
    setPending(false);

    if (!result.success) {
      setError(result.error || "Something went wrong");
    } else {
      onSuccess?.();
      router.refresh();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Barcode Scanner */}
      <BarcodeScanner onProductFound={handleProductFound} />

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Photo</Label>
        <ImageUpload
          currentImageUrl={imageUrl || null}
          onImageUploaded={setImageUrl}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Item name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Wireless Headphones"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Any details about the item..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price (optional)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantityDesired">Quantity</Label>
          <Input
            id="quantityDesired"
            name="quantityDesired"
            type="number"
            min="1"
            max="99"
            defaultValue={item?.quantity_desired ?? 1}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Product link (optional)</Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {ITEM_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clothing Sizes */}
      {showSizes && (
        <div className="space-y-2">
          <Label>Size</Label>
          <div className="flex flex-wrap gap-2">
            {CLOTHING_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedSize === size
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shoe Sizes */}
      {showShoeSizes && (
        <div className="space-y-2">
          <Label>Shoe Size</Label>
          <div className="flex flex-wrap gap-2">
            {SHOE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedSize === size
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select name="priority" defaultValue={String(item?.priority ?? 3)}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Color preference, specific model..."
          defaultValue={item?.notes || ""}
          rows={2}
        />
      </div>

      <input type="hidden" name="currency" value="USD" />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
