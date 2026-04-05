import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Gift, Heart, Mail, Phone, Sparkles, ThumbsDown } from "lucide-react";
import { ProfileEditor } from "@/components/auth/profile-editor";
import { EditProfileToggle } from "@/components/auth/edit-profile-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { OCCASION_TYPES } from "@/lib/constants";
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
    .select("id, title, slug, description, occasion, occasion_date")
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
          <div className="flex gap-5">
            {/* Large avatar */}
            <div className="shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-36 w-36 rounded-2xl object-cover shadow-md"
                />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-muted text-4xl font-bold text-muted-foreground shadow-md">
                  {initials}
                </div>
              )}
            </div>

            {/* Info to the right */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">
                {profile?.display_name}
              </h1>
              <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{profile?.email}</span>
              </div>

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div>
                  <span className="font-bold">{registryCount}</span>{" "}
                  <span className="text-muted-foreground">Registries</span>
                </div>
                <div>
                  <span className="font-bold">{followerCount}</span>{" "}
                  <span className="text-muted-foreground">Followers</span>
                </div>
                <div>
                  <span className="font-bold">{followingCount || 0}</span>{" "}
                  <span className="text-muted-foreground">Following</span>
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{profile.bio}</p>
              )}

              {/* Date pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile?.birthday && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium">
                    <Calendar className="h-3 w-3" />
                    {formatDate(profile.birthday)}
                  </span>
                )}
                {profile?.anniversary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium">
                    <Heart className="h-3 w-3" />
                    {formatDate(profile.anniversary)}
                  </span>
                )}
                {profile?.phone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium">
                    <Phone className="h-3 w-3" />
                    {profile.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interests & Dislikes — full width below */}
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
        <h2 className="text-lg font-semibold">My Registries</h2>
        <div className="mt-3 space-y-2">
          {myRegistries && myRegistries.length > 0 ? (
            myRegistries.map((reg) => {
              const occasionLabel = OCCASION_TYPES.find(
                (o) => o.value === reg.occasion
              )?.label;

              return (
                <Link
                  key={reg.id}
                  href={`/registries/${reg.slug}`}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{reg.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {occasionLabel && <span>{occasionLabel}</span>}
                      {reg.occasion_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(reg.occasion_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {reg.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {reg.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })
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
