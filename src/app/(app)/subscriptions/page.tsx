import Link from "next/link";
import { Users, Gift, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { UnsubscribeButton } from "@/components/invitations/unsubscribe-button";
import { OCCASION_TYPES } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscriptions",
};

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get subscriptions with registry and owner info
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, registries(*)")
    .eq("subscriber_id", user!.id)
    .order("created_at", { ascending: false });

  // Get owner profiles for each registry
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

  const { data: owners } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ownerIds)
    : { data: [] };

  const ownerMap = new Map(
    (owners || []).map((o) => [o.id, o.display_name])
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      <p className="text-sm text-muted-foreground">
        Registries you&apos;re following
      </p>

      <div className="mt-8">
        {subscriptions && subscriptions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((sub) => {
              const registry = sub.registries as unknown as {
                id: string;
                title: string;
                slug: string;
                description: string | null;
                occasion: string | null;
                occasion_date: string | null;
                owner_id: string;
              };
              if (!registry) return null;

              const occasionLabel = OCCASION_TYPES.find(
                (o) => o.value === registry.occasion
              )?.label;
              const ownerName = ownerMap.get(registry.owner_id) || "Unknown";

              return (
                <Card key={sub.id} className="relative">
                  <Link href={`/registries/${registry.slug}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{registry.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        by {ownerName}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {registry.description && (
                        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                          {registry.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {occasionLabel && (
                          <span className="flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            {occasionLabel}
                          </span>
                        )}
                        {registry.occasion_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(registry.occasion_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                  <div className="absolute right-3 top-3">
                    <UnsubscribeButton registryId={registry.id} />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No subscriptions yet"
            description="When someone shares a registry with you and you accept the invite, it will appear here."
          />
        )}
      </div>
    </div>
  );
}
