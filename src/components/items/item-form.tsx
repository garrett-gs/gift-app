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
import { PRIORITY_LABELS } from "@/lib/constants";
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
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
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
      <div className="space-y-2">
        <Label htmlFor="name">Item name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Wireless Headphones"
          defaultValue={item?.name}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Any details about the item..."
          defaultValue={item?.description || ""}
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
            defaultValue={item?.price ?? ""}
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
          defaultValue={item?.url || ""}
        />
      </div>

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
          placeholder="Size, color, specific model..."
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
