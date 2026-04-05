import Link from "next/link";
import { Heart, Gift, Calendar, Cake, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { NearbyAlert } from "@/components/shared/nearby-alert";
import { OCCASION_TYPES } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My People",
};

function getUpcomingBirthday(birthday: string | null): string | null {
  if (!birthday) return null;
  const today = new Date();
  const bday = new Date(birthday);
  // Set birthday to this year
  bday.setFullYear(today.getFullYear());
  // If already passed this year, use next year
  if (bday < today) {
    bday.setFullYear(today.getFullYear() + 1);
  }
  const diffDays = Math.ceil(
    (bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today!";
  if (diffDays === 1) return "Tomorrow!";
  if (diffDays <= 30) return `In ${diffDays} days`;
  if (diffDays <= 90) {
    const months = Math.round(diffDays / 30);
    return `In ${months} month${months > 1 ? "s" : ""}`;
  }
  return null;
}

export default async function MyPeoplePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get subscriptions with registry info
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, registries(*)")
    .eq("subscriber_id", user!.id)
    .order("created_at", { ascending: false });

  // Get unique owner IDs
  const ownerIds = [
    ...new Set(
      (subscriptions || [])
        .map((s) => {
          const reg = s.registries as unknown as { owner_id: string };
          return reg?.owner_id;
        })
        .filter(Boolean)
    ),
  ];

  // Get full profiles for each person
  const { data: owners } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, birthday, interests")
        .in("id", ownerIds)
    : { data: [] };

  // Group registries by owner
  const peopleMap = new Map<
    string,
    {
      profile: (typeof owners extends (infer T)[] | null ? T : never);
      registries: {
        id: string;
        title: string;
        slug: string;
        occasion: string | null;
        occasion_date: string | null;
      }[];
    }
  >();

  for (const owner of owners || []) {
    peopleMap.set(owner.id, { profile: owner, registries: [] });
  }

  for (const sub of subscriptions || []) {
    const reg = sub.registries as unknown as {
      id: string;
      title: string;
      slug: string;
      occasion: string | null;
      occasion_date: string | null;
      owner_id: string;
    };
    if (reg && peopleMap.has(reg.owner_id)) {
      peopleMap.get(reg.owner_id)!.registries.push({
        id: reg.id,
        title: reg.title,
        slug: reg.slug,
        occasion: reg.occasion,
        occasion_date: reg.occasion_date,
      });
    }
  }

  const people = [...peopleMap.values()];

  // Sort: people with upcoming birthdays first
  people.sort((a, b) => {
    const aBday = a.profile.birthday ? getUpcomingBirthday(a.profile.birthday) : null;
    const bBday = b.profile.birthday ? getUpcomingBirthday(b.profile.birthday) : null;
    if (aBday && !bBday) return -1;
    if (!aBday && bBday) return 1;
    return 0;
  });

  // Fetch store-tagged items from subscribed registries for nearby alerts
  const registryIds = (subscriptions || [])
    .map((s) => {
      const reg = s.registries as unknown as { id: string };
      return reg?.id;
    })
    .filter(Boolean);

  let storeItems: {
    item_name: string;
    store_name: string;
    store_address: string;
    store_lat: number;
    store_lng: number;
    owner_name: string;
    registry_slug: string;
  }[] = [];

  if (registryIds.length > 0) {
    const { data: itemsWithStores } = await supabase
      .from("registry_items")
      .select("name, store_name, store_address, store_lat, store_lng, registry_id")
      .in("registry_id", registryIds)
      .not("store_lat", "is", null)
      .not("store_lng", "is", null)
      .eq("is_archived", false);

    if (itemsWithStores) {
      const ownerMap = new Map(
        (owners || []).map((o) => [o.id, o.display_name])
      );
      const regOwnerMap = new Map(
        (subscriptions || []).map((s) => {
          const reg = s.registries as unknown as { id: string; slug: string; owner_id: string };
          return [reg?.id, { slug: reg?.slug, ownerName: ownerMap.get(reg?.owner_id) || "Someone" }];
        })
      );

      storeItems = itemsWithStores
        .filter((i) => i.store_lat && i.store_lng && i.store_name)
        .map((i) => {
          const regInfo = regOwnerMap.get(i.registry_id);
          return {
            item_name: i.name,
            store_name: i.store_name!,
            store_address: i.store_address || "",
            store_lat: Number(i.store_lat),
            store_lng: Number(i.store_lng),
            owner_name: regInfo?.ownerName || "Someone",
            registry_slug: regInfo?.slug || "",
          };
        });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">My People</h1>
      <p className="text-sm text-muted-foreground">
        People you&apos;re shopping for
      </p>

      <div className="mt-6">
        <NearbyAlert storeItems={storeItems} />
      </div>

      <div className="mt-6">
        {people.length > 0 ? (
          <div className="space-y-4">
            {people.map(({ profile, registries }) => {
              const upcomingBday = getUpcomingBirthday(profile.birthday);
              const birthdayDate = profile.birthday
                ? new Date(profile.birthday + "T00:00:00").toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })
                : null;

              return (
                <div
                  key={profile.id}
                  className="rounded-xl border bg-card overflow-hidden"
                >
                  {/* Person header */}
                  <div className="flex items-center gap-4 p-4">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                        {profile.display_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-lg truncate">
                        {profile.display_name}
                      </h2>
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {profile.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {birthdayDate && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Cake className="h-3 w-3" />
                            {birthdayDate}
                          </span>
                        )}
                        {upcomingBday && (
                          <span className="inline-flex items-center rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700">
                            {upcomingBday}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interests/dislikes hint */}
                  {profile.interests && (
                    <div className="px-4 pb-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Loves:</span> {profile.interests}
                      </p>
                    </div>
                  )}

                  {/* Their registries */}
                  <div className="border-t">
                    {registries.map((reg) => {
                      const occasionLabel = OCCASION_TYPES.find(
                        (o) => o.value === reg.occasion
                      )?.label;

                      return (
                        <Link
                          key={reg.id}
                          href={`/registries/${reg.slug}`}
                          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 border-b last:border-b-0"
                        >
                          <Gift className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {reg.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {occasionLabel && <span>{occasionLabel}</span>}
                              {reg.occasion_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(reg.occasion_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Heart className="h-12 w-12" />}
            title="No people yet"
            description="When someone shares a registry with you and you accept, they'll show up here. You can also find friends to connect with."
            action={
              <Link
                href="/find-friends"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Find Friends
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
