import { createClient } from "@/lib/supabase/server";
import { Calendar, Heart, Mail, Phone, Sparkles, ThumbsDown } from "lucide-react";
import { ProfileEditor } from "@/components/auth/profile-editor";
import { Card, CardContent } from "@/components/ui/card";
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

  // Count registries
  const { count: registryCount } = await supabase
    .from("registries")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user!.id);

  // Count followers (people subscribed to my registries)
  const { data: myRegistries } = await supabase
    .from("registries")
    .select("id")
    .eq("owner_id", user!.id);

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

  return (
    <div className="mx-auto max-w-2xl">
      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Banner area */}
          <div className="h-20 bg-gradient-to-r from-gray-800 to-gray-600" />

          <div className="px-5 pb-5">
            {/* Avatar + Name row */}
            <div className="flex items-end gap-4 -mt-10">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-20 w-20 rounded-full border-4 border-background object-cover shadow-md"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-muted text-xl font-bold text-muted-foreground shadow-md">
                  {initials}
                </div>
              )}

              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-xl font-bold truncate">
                  {profile?.display_name}
                </h1>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-lg font-bold">{registryCount || 0}</p>
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

            {/* Bio */}
            {profile?.bio && (
              <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
            )}

            {/* Quick info pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              {profile?.birthday && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  <Calendar className="h-3 w-3" />
                  {formatDate(profile.birthday)}
                </span>
              )}
              {profile?.anniversary && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  <Heart className="h-3 w-3" />
                  Anniversary {formatDate(profile.anniversary)}
                </span>
              )}
              {profile?.phone && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  <Phone className="h-3 w-3" />
                  {profile.phone}
                </span>
              )}
            </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
        {profile && <ProfileEditor profile={profile} />}
      </div>
    </div>
  );
}
