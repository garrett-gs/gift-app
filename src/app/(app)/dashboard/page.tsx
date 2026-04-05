import Link from "next/link";
import { Plus, List, Gift as GiftIcon, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RegistryCard } from "@/components/registry/registry-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: registries } = await supabase
    .from("registries")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const initials = (profile?.display_name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const birthdayDisplay = profile?.birthday
    ? new Date(profile.birthday + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Profile Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-5">
            <Link href="/settings" className="shrink-0">
              <Avatar className="h-32 w-32 border-4 shadow-md sm:h-36 sm:w-36">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                )}
                <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="mt-4 min-w-0 flex-1 sm:mt-0">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-xl font-bold">{profile?.display_name}</h1>
                <Link
                  href="/settings"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }))}
                  title="Edit profile"
                >
                  <Pencil className="h-3 w-3" />
                </Link>
              </div>

              {profile?.bio && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.bio}
                </p>
              )}

              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
                {birthdayDisplay && (
                  <span className="flex items-center gap-1">
                    <GiftIcon className="h-3 w-3" />
                    Birthday: {birthdayDisplay}
                  </span>
                )}
                {profile?.interests && (
                  <span className="truncate max-w-[250px]">
                    Likes: {profile.interests}
                  </span>
                )}
              </div>

              {profile?.dislikes && (
                <p className="mt-1 text-xs text-muted-foreground truncate max-w-[300px]">
                  Dislikes: {profile.dislikes}
                </p>
              )}

              {!profile?.bio && !profile?.birthday && !profile?.interests && (
                <Link
                  href="/settings"
                  className="mt-2 inline-block text-xs text-primary hover:underline"
                >
                  Complete your profile so people know what to get you
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registries */}
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
        <div className="mt-4">
          {registries && registries.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {registries.map((registry) => (
                  <RegistryCard key={registry.id} registry={registry} />
                ))}
              </div>
              {registries.length >= 6 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/registries"
                    className="text-sm text-primary hover:underline"
                  >
                    View all registries
                  </Link>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<List className="h-12 w-12" />}
              title="No registries yet"
              description="Create your first gift registry to get started."
              action={
                <Link
                  href="/registries/new"
                  className={cn(buttonVariants(), "gap-2")}
                >
                  <Plus className="h-4 w-4" />
                  Create Registry
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
