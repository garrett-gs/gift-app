import Link from "next/link";
import { notFound } from "next/navigation";
import { Gift, Calendar, Cake, Heart, ThumbsDown, ChevronRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FollowAllButton } from "@/components/invitations/follow-all-button";
import { OCCASION_TYPES } from "@/lib/constants";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", id)
    .single();

  return { title: profile?.display_name || "Profile" };
}

function getUpcomingBirthday(birthday: string): string | null {
  const today = new Date();
  const bday = new Date(birthday + "T00:00:00");
  bday.setFullYear(today.getFullYear());
  if (bday < today) {
    bday.setFullYear(today.getFullYear() + 1);
  }
  const diffDays = Math.ceil(
    (bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today!";
  if (diffDays === 1) return "Tomorrow!";
  if (diffDays <= 90) return `In ${diffDays} days`;
  return null;
}

export default async function PersonProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get this person's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  // Get ALL of this person's registries
  const { data: allRegistries } = await supabase
    .from("registries")
    .select("id, title, slug, description, occasion, occasion_date, owner_id")
    .eq("owner_id", id)
    .order("created_at", { ascending: false });

  // Get which ones the current user is subscribed to
  const { data: mySubscriptions } = await supabase
    .from("subscriptions")
    .select("registry_id")
    .eq("subscriber_id", user!.id);

  const subscribedIds = new Set(
    (mySubscriptions || []).map((s) => s.registry_id)
  );

  const theirRegistries = (allRegistries || []).map((r) => ({
    ...r,
    isFollowing: subscribedIds.has(r.id),
  }));

  const isFollowingAny = theirRegistries.some((r) => r.isFollowing);
  const allFollowed = theirRegistries.length > 0 && theirRegistries.every((r) => r.isFollowing);

  const initials = (profile.display_name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const birthdayDisplay = profile.birthday
    ? new Date(profile.birthday + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : null;

  const upcomingBday = profile.birthday
    ? getUpcomingBirthday(profile.birthday)
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href="/subscriptions"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        My People
      </Link>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-5">
            <Avatar className="h-32 w-32 border-4 shadow-md sm:h-36 sm:w-36">
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              )}
              <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="mt-4 min-w-0 flex-1 sm:mt-0">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl font-bold">{profile.display_name}</h1>
                {theirRegistries.length > 0 && (
                  <FollowAllButton
                    registryIds={theirRegistries.filter((r) => !r.isFollowing).map((r) => r.id)}
                    alreadyFollowingAll={allFollowed}
                  />
                )}
              </div>

              {profile.bio && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {profile.bio}
                </p>
              )}

              {/* Birthday */}
              {birthdayDisplay && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Cake className="h-4 w-4" />
                    Birthday: {birthdayDisplay}
                  </span>
                  {upcomingBday && (
                    <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">
                      {upcomingBday}
                    </Badge>
                  )}
                </div>
              )}

              {/* Interests */}
              {profile.interests && (
                <div className="mt-3">
                  <p className="flex items-center gap-1 text-sm">
                    <Heart className="h-4 w-4 text-pink-500 shrink-0" />
                    <span className="font-medium">Loves:</span>{" "}
                    <span className="text-muted-foreground">{profile.interests}</span>
                  </p>
                </div>
              )}

              {/* Dislikes */}
              {profile.dislikes && (
                <div className="mt-2">
                  <p className="flex items-center gap-1 text-sm">
                    <ThumbsDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">Dislikes:</span>{" "}
                    <span className="text-muted-foreground">{profile.dislikes}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Their Registries */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">
          {profile.display_name.split(" ")[0]}&apos;s Registries
        </h2>
        <div className="mt-4 space-y-2">
          {theirRegistries.length > 0 ? (
            theirRegistries.map((reg) => {
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
                  {reg.isFollowing && (
                    <span className="text-xs text-green-600 font-medium shrink-0">Following</span>
                  )}
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No registries shared with you yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
