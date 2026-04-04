"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", profile.id);

    setPending(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={profile.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={1}
          maxLength={50}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile updated</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
