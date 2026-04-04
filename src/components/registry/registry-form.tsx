"use client";

import { useState } from "react";
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
import { OCCASION_TYPES } from "@/lib/constants";
import type { Registry } from "@/lib/types";

interface RegistryFormProps {
  registry?: Registry;
  action: (formData: FormData) => Promise<unknown>;
  submitLabel: string;
}

export function RegistryForm({ registry, action, submitLabel }: RegistryFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await action(formData) as { success: boolean; error?: string } | undefined;
      if (result && !result.success) {
        setError(result.error || "Something went wrong");
      }
    } catch {
      // redirect throws, which is expected on success
    }
    setPending(false);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Registry name</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g., My Birthday 2026"
          defaultValue={registry?.title}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What's this registry for?"
          defaultValue={registry?.description || ""}
          rows={3}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="occasion">Occasion (optional)</Label>
          <Select name="occasion" defaultValue={registry?.occasion || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select occasion" />
            </SelectTrigger>
            <SelectContent>
              {OCCASION_TYPES.map((occ) => (
                <SelectItem key={occ.value} value={occ.value}>
                  {occ.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="occasionDate">Date (optional)</Label>
          <Input
            id="occasionDate"
            name="occasionDate"
            type="date"
            defaultValue={registry?.occasion_date || ""}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          name="isPublic"
          defaultChecked={registry?.is_public}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="isPublic" className="text-sm font-normal">
          Make this registry public (anyone with the link can view it)
        </Label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
