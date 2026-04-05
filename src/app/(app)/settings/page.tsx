import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Cake, Calendar, Heart, Mail, Phone, Plus, Sparkles, ThumbsDown } from "lucide-react";
import { ProfileEditor } from "@/components/auth/profile-editor";
import { EditProfileToggle } from "@/components/auth/edit-profile-toggle";
import { RegistryCard } from "@/components/registry/registry-card";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import { cn, formatPhone } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  // Get my registries
  const { data: myRegistries } = await supabase
    .from("registries")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  // Count followers (people subscribed to my registries)
  let followerCount = 0;
  if (myRegistries && myRegistries.length > 0) {
    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("registry_id", myRegistries.map((r) => r.id));
    followerCount = count || 0;
  }

  // Count people I follow
  const { count: followingCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("subscriber_id", user!.id);

  const initials = profile?.display_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const registryCount = myRegistries?.length || 0;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-5">
          {/* Photo centered on top */}
          <div className="flex justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-40 w-40 rounded-2xl object-cover shadow-md"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-muted text-5xl font-bold text-muted-foreground shadow-md">
                {initials}
              </div>
            )}
          </div>

          {/* Name + contact info */}
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-bold">{profile?.display_name}</h1>
            <div className="mt-1 flex flex-col items-center gap-0.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{profile?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{formatPhone(profile.phone)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="text-lg font-bold">{registryCount}</p>
              <p className="text-xs text-muted-foreground">Registries</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{followerCount}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{followingCount || 0}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>

          {/* Bio / Description */}
          {profile?.bio && (
            <p className="mt-4 text-sm text-muted-foreground text-center">{profile.bio}</p>
          )}

          {/* Important date pills */}
          {(profile?.birthday || profile?.anniversary) && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {profile?.birthday && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  <Cake className="h-3.5 w-3.5" />
                  Birthday: {formatDate(profile.birthday)}
                </span>
              )}
              {profile?.anniversary && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  <Heart className="h-3.5 w-3.5" />
                  Anniversary: {formatDate(profile.anniversary)}
                </span>
              )}
            </div>
          )}

          {/* Interests & Dislikes */}
          {(profile?.interests || profile?.dislikes) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {profile?.interests && (
                <div className="rounded-lg bg-green-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Loves
                  </div>
                  <p className="text-xs text-green-800">{profile.interests}</p>
                </div>
              )}
              {profile?.dislikes && (
                <div className="rounded-lg bg-red-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Dislikes
                  </div>
                  <p className="text-xs text-red-800">{profile.dislikes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Registries */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Registries</h2>
          <Link
            href="/registries/new"
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            <Plus className="h-3 w-3" />
            New Registry
          </Link>
        </div>
        <div className="mt-3">
          {myRegistries && myRegistries.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {myRegistries.map((reg) => (
                <RegistryCard key={reg.id} registry={reg} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              You haven&apos;t created any registries yet.
            </p>
          )}
        </div>
      </div>

      {/* Collapsible Edit Profile */}
      <div className="mt-8">
        {profile && (
          <EditProfileToggle>
            <ProfileEditor profile={profile} />
          </EditProfileToggle>
        )}
      </div>
    </div>
  );
}
