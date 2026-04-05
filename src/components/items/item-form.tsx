"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const [showDetails, setShowDetails] = useState(!!item);
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [category, setCategory] = useState("general");
  const [selectedSize, setSelectedSize] = useState("");

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
    setShowDetails(true);
  }

  async function handleSubmit(formData: FormData) {
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
    <form action={handleSubmit} className="space-y-4">
      {/* Quick actions row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <BarcodeScanner onProductFound={handleProductFound} />
        </div>
      </div>

      {/* Photo - always visible */}
      <ImageUpload
        currentImageUrl={imageUrl || null}
        onImageUploaded={setImageUrl}
      />

      {/* Name - always visible */}
      <div className="space-y-1">
        <Label htmlFor="name">What is it?</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Blue Nike Running Shoes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Price - always visible since it's important */}
      <div className="space-y-1">
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

      {/* Link - always visible */}
      <div className="space-y-1">
        <Label htmlFor="url">Link (optional)</Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="Paste product URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      {/* Toggle for more details */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm text-muted-foreground hover:text-foreground"
      >
        {showDetails ? (
          <>Less details <ChevronUp className="h-4 w-4" /></>
        ) : (
          <>More details <ChevronDown className="h-4 w-4" /></>
        )}
      </button>

      {/* Collapsible details */}
      {showDetails && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Any details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val || "general")}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
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

            <div className="space-y-1">
              <Label>Priority</Label>
              <Select name="priority" defaultValue={String(item?.priority ?? 3)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
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
          </div>

          {/* Clothing Sizes */}
          {showSizes && (
            <div className="space-y-1">
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
            <div className="space-y-1">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
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

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Color, specific model..."
              defaultValue={item?.notes || ""}
              rows={2}
            />
          </div>
        </div>
      )}

      <input type="hidden" name="currency" value="USD" />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
