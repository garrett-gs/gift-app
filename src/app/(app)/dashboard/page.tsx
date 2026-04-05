import Link from "next/link";
import { Plus, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  // My registries for carousel
  const { data: registries } = await supabase
    .from("registries")
    .select("id, title, slug, cover_image_url")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  // Get registries I'm subscribed to
  const { data: mySubscriptions } = await supabase
    .from("subscriptions")
    .select("registry_id")
    .eq("subscriber_id", user!.id);

  const subscribedRegistryIds = (mySubscriptions || []).map(
    (s) => s.registry_id
  );

  // Get recent items from subscribed registries
  interface FeedItem {
    id: string;
    name: string;
    price: number | null;
    image_url: string | null;
    created_at: string;
    registry_id: string;
  }

  interface FeedRegistry {
    id: string;
    title: string;
    slug: string;
    owner_id: string;
  }

  interface FeedProfile {
    id: string;
    display_name: string;
    avatar_url: string | null;
  }

  let feedItems: FeedItem[] = [];
  let feedRegistries: FeedRegistry[] = [];
  let feedProfiles: FeedProfile[] = [];

  if (subscribedRegistryIds.length > 0) {
    const { data: recentItems } = await supabase
      .from("registry_items")
      .select("id, name, price, image_url, created_at, registry_id")
      .in("registry_id", subscribedRegistryIds)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(20);

    feedItems = recentItems || [];

    if (feedItems.length > 0) {
      const regIds = [...new Set(feedItems.map((i) => i.registry_id))];
      const { data: regs } = await supabase
        .from("registries")
        .select("id, title, slug, owner_id")
        .in("id", regIds);
      feedRegistries = regs || [];

      const ownerIds = [...new Set(feedRegistries.map((r) => r.owner_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ownerIds);
      feedProfiles = profiles || [];
    }
  }

  // Build lookup maps
  const regMap = new Map(feedRegistries.map((r) => [r.id, r]));
  const profileMap = new Map(feedProfiles.map((p) => [p.id, p]));

  // Group feed items by date
  function timeAgo(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Registry Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">My Registries</h2>
          <Link
            href="/registries"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {registries && registries.length > 0 ? (
            <>
              {registries.map((reg) => (
                <Link
                  key={reg.id}
                  href={`/registries/${reg.slug}`}
                  className="shrink-0"
                >
                  <div className="w-24 space-y-1.5">
                    {reg.cover_image_url ? (
                      <img
                        src={reg.cover_image_url}
                        alt={reg.title}
                        className="h-24 w-24 rounded-xl object-cover border shadow-sm"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-muted shadow-sm">
                        <Gift className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-[11px] font-medium text-center line-clamp-2 leading-tight">
                      {reg.title}
                    </p>
                  </div>
                </Link>
              ))}
              <Link href="/registries/new" className="shrink-0">
                <div className="w-24 space-y-1.5">
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed bg-muted/50">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] font-medium text-center text-muted-foreground">
                    New Registry
                  </p>
                </div>
              </Link>
            </>
          ) : (
            <Link href="/registries/new" className="shrink-0">
              <div className="w-24 space-y-1.5">
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed bg-muted/50">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-[11px] font-medium text-center text-muted-foreground">
                  Create First
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">What&apos;s New</h2>

        {feedItems.length > 0 ? (
          <div className="space-y-3">
            {feedItems.map((item) => {
              const reg = regMap.get(item.registry_id);
              const owner = reg ? profileMap.get(reg.owner_id) : null;
              const ownerInitials = (owner?.display_name || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Link
                  key={item.id}
                  href={`/registries/${reg?.slug || ""}`}
                  className="flex gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  {/* Owner avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    {owner?.avatar_url && (
                      <AvatarImage src={owner.avatar_url} alt={owner.display_name} />
                    )}
                    <AvatarFallback className="text-xs">{ownerInitials}</AvatarFallback>
                  </Avatar>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{owner?.display_name || "Someone"}</span>
                      {" added "}
                      <span className="font-semibold">{item.name}</span>
                      {" to "}
                      <span className="text-muted-foreground">{reg?.title || "a registry"}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.price != null && (
                        <span className="text-xs text-muted-foreground">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Item image */}
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-14 w-14 rounded-lg object-cover shrink-0"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Gift className="h-12 w-12" />}
            title="No activity yet"
            description={
              subscribedRegistryIds.length > 0
                ? "When people you follow add items to their registries, they'll show up here."
                : "Follow people to see what they're adding to their wish lists."
            }
            action={
              subscribedRegistryIds.length === 0 ? (
                <Link
                  href="/find-friends"
                  className={cn(buttonVariants(), "gap-2")}
                >
                  Find People
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
