"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/items/image-upload";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface SpecialOccasion {
  name: string;
  date: string;
}

export function ProfileEditor({ profile }: { profile: Profile }) {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [birthday, setBirthday] = useState(profile.birthday || "");
  const [anniversary, setAnniversary] = useState(profile.anniversary || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [interests, setInterests] = useState(profile.interests || "");
  const [dislikes, setDislikes] = useState(profile.dislikes || "");
  const [specialOccasions, setSpecialOccasions] = useState<SpecialOccasion[]>(
    (profile.special_occasions as unknown as SpecialOccasion[]) || []
  );

  function addOccasion() {
    setSpecialOccasions([...specialOccasions, { name: "", date: "" }]);
  }

  function removeOccasion(index: number) {
    setSpecialOccasions(specialOccasions.filter((_, i) => i !== index));
  }

  function updateOccasion(index: number, field: "name" | "date", value: string) {
    const updated = [...specialOccasions];
    updated[index] = { ...updated[index], [field]: value };
    setSpecialOccasions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    // Filter out empty occasions
    const validOccasions = specialOccasions.filter((o) => o.name && o.date);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl || null,
        phone: phone || null,
        birthday: birthday || null,
        anniversary: anniversary || null,
        special_occasions: JSON.parse(JSON.stringify(validOccasions)),
        bio: bio || null,
        interests: interests || null,
        dislikes: dislikes || null,
      })
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Photo */}
      <div className="space-y-2">
        <Label>Profile photo</Label>
        <div className="flex items-start gap-6">
          {avatarUrl ? (
            <div className="relative">
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-24 w-24 rounded-full object-cover border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                className="absolute -right-1 -top-1"
                onClick={() => setAvatarUrl("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed text-2xl font-bold text-muted-foreground">
              {displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
          <div className="flex-1">
            <ImageUpload
              currentImageUrl={avatarUrl || null}
              onImageUploaded={setAvatarUrl}
            />
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
          <p className="text-xs text-muted-foreground">
            Used to help friends find you on GIFT
          </p>
        </div>
      </div>

      <Separator />

      {/* About Me */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">About Me</h2>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a little about yourself..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interests">Things I like / Currently into</Label>
          <Textarea
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g., Cooking, hiking, vintage records, woodworking, sci-fi movies..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dislikes">Things I don't like / Please avoid</Label>
          <Textarea
            id="dislikes"
            value={dislikes}
            onChange={(e) => setDislikes(e.target.value)}
            placeholder="e.g., No candles, already have enough mugs, allergic to wool..."
            rows={3}
          />
        </div>
      </div>

      <Separator />

      {/* Important Dates */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Important Dates</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anniversary">Anniversary</Label>
            <Input
              id="anniversary"
              type="date"
              value={anniversary}
              onChange={(e) => setAnniversary(e.target.value)}
            />
          </div>
        </div>

        {/* Special Occasions */}
        <div className="space-y-3">
          <Label>Other special occasions</Label>
          {specialOccasions.map((occasion, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Occasion name"
                value={occasion.name}
                onChange={(e) => updateOccasion(index, "name", e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={occasion.date}
                onChange={(e) => updateOccasion(index, "date", e.target.value)}
                className="w-40"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeOccasion(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={addOccasion}
          >
            <Plus className="h-3 w-3" />
            Add occasion
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile saved!</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
