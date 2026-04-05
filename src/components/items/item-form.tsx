"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
import { StorePicker } from "@/components/items/store-picker";
import {
  PRIORITY_LABELS,
  ITEM_CATEGORIES,
  SHOE_WIDTHS,
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
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [detectedSizes, setDetectedSizes] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [category, setCategory] = useState("general");
  const [selectedSize, setSelectedSize] = useState("");
  const [shoeWidth, setShoeWidth] = useState("regular");

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

  async function fetchUrlMetadata(productUrl: string, force = false) {
    if (!productUrl || !productUrl.startsWith("http")) return;
    setFetchingUrl(true);
    try {
      const res = await fetch("/api/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.image) setImageUrl(data.image);
        if (data.title) setName((prev: string) => (force || !prev) ? data.title : prev);
        if (data.description) setDescription((prev: string) => (force || !prev) ? data.description : prev);
        if (data.price) setPrice((prev: string) => (force || !prev) ? String(data.price) : prev);
        if (data.category) {
          setCategory(data.category);
          setShowDetails(true);
        }
        if (data.availableSizes && data.availableSizes.length > 0) {
          setDetectedSizes(data.availableSizes);
        }
      }
    } catch {
      // Silently fail — user can still fill in manually
    }
    setFetchingUrl(false);
  }

  // Auto-fetch when editing an item that has a URL but no image
  useEffect(() => {
    if (item?.url && !item?.image_url && url.startsWith("http")) {
      fetchUrlMetadata(url);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(formData: FormData) {
    formData.set("imageUrl", imageUrl);
    formData.set("category", category);
    const sizeValue = category === "shoes" && selectedSize
      ? `${selectedSize} ${shoeWidth !== "regular" ? `(${SHOE_WIDTHS.find(w => w.value === shoeWidth)?.label})` : ""}`.trim()
      : selectedSize;
    formData.set("size", sizeValue);

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
        onProductIdentified={(product) => {
          if (product.name && !name) setName(product.name);
          if (product.price && !price) setPrice(String(product.price));
          if (product.url && !url) setUrl(product.url);
        }}
      />
      {imageUrl && url && (
        <p className="text-xs text-muted-foreground -mt-2">
          Tip: If this isn&apos;t the right color or style, screenshot the one you want and tap &quot;Replace&quot;
        </p>
      )}

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
          autoComplete="off"
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
          autoComplete="off"
        />
      </div>

      {/* Link - always visible, auto-fetches product info */}
      <div className="space-y-1">
        <Label htmlFor="url">Link (optional)</Label>
        <div className="relative">
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="Paste product URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text");
              if (pasted.startsWith("http")) {
                // Force overwrite — pasting a new URL means new product
                setTimeout(() => fetchUrlMetadata(pasted, true), 100);
              }
            }}
            onBlur={() => {
              if (url.startsWith("http") && !fetchingUrl) {
                fetchUrlMetadata(url);
              }
            }}
          />
          {fetchingUrl && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {fetchingUrl && (
          <p className="text-xs text-muted-foreground">Fetching product info...</p>
        )}
        {!fetchingUrl && url.startsWith("http") && !imageUrl && (
          <button
            type="button"
            onClick={() => fetchUrlMetadata(url, true)}
            className="text-xs text-primary hover:underline"
          >
            Fetch image and details from link
          </button>
        )}
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

          {/* Sizes — auto-detected or manual */}
          {(showSizes || showShoeSizes || detectedSizes.length > 0) && (
            <div className="space-y-1">
              <Label>{showShoeSizes ? "Shoe Size" : "Size"} <span className="text-xs text-muted-foreground">(pick yours)</span></Label>
              <div className="flex flex-wrap gap-2">
                {(detectedSizes.length > 0
                  ? detectedSizes
                  : showShoeSizes
                    ? [...SHOE_SIZES]
                    : [...CLOTHING_SIZES]
                ).map((size) => (
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

          {/* Shoe Width */}
          {showShoeSizes && (
            <div className="space-y-1">
              <Label>Width</Label>
              <div className="flex flex-wrap gap-2">
                {SHOE_WIDTHS.map((width) => (
                  <button
                    key={width.value}
                    type="button"
                    onClick={() => setShoeWidth(width.value)}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      shoeWidth === width.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {width.label}
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

          {/* Store location */}
          <div className="space-y-2">
            <Label>Seen in a store? (optional)</Label>
            <StorePicker
              defaultStoreName={item?.store_name || ""}
              defaultStoreAddress={item?.store_address || ""}
              onStoreSelected={(store) => {
                // StorePicker handles hidden inputs for form submission
              }}
            />
            <p className="text-xs text-muted-foreground">
              Subscribers near this store will be alerted
            </p>
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
