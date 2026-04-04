import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Calendar, Gift, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AddItemDialog } from "@/components/items/add-item-dialog";
import { ItemGrid } from "@/components/items/item-grid";
import { OCCASION_TYPES } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import type { Purchase, Profile } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: registry } = await supabase
    .from("registries")
    .select("title")
    .eq("slug", slug)
    .single();

  return { title: registry?.title || "Registry" };
}

export default async function RegistryDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: registry } = await supabase
    .from("registries")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!registry) {
    notFound();
  }

  const isOwner = registry.owner_id === user?.id;

  // Check if current user is a subscriber
  let isSubscriber = false;
  if (user && !isOwner) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("registry_id", registry.id)
      .eq("subscriber_id", user.id)
      .single();
    isSubscriber = !!sub;
  }

  const { data: items } = await supabase
    .from("registry_items")
    .select("*")
    .eq("registry_id", registry.id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  // LAYER 2 OF SURPRISE PRESERVATION:
  // Only fetch purchases if the viewer is NOT the owner.
  // The database RLS (Layer 1) would block it anyway, but we don't even query.
  let purchases: Purchase[] = [];
  let purchaserProfiles: Profile[] = [];

  if (!isOwner && isSubscriber && items && items.length > 0) {
    const itemIds = items.map((i) => i.id);

    const { data: purchaseData } = await supabase
      .from("purchases")
      .select("*")
      .in("item_id", itemIds);

    purchases = purchaseData || [];

    // Get purchaser profiles for display
    if (purchases.length > 0) {
      const purchaserIds = [...new Set(purchases.map((p) => p.purchaser_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", purchaserIds);
      purchaserProfiles = profiles || [];
    }
  }

  const occasionLabel = OCCASION_TYPES.find(
    (o) => o.value === registry.occasion
  )?.label;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{registry.title}</h1>
            {registry.is_public && (
              <Badge variant="secondary">Public</Badge>
            )}
          </div>
          {registry.description && (
            <p className="mt-1 text-muted-foreground">
              {registry.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            {occasionLabel && (
              <span className="flex items-center gap-1">
                <Gift className="h-4 w-4" />
                {occasionLabel}
              </span>
            )}
            {registry.occasion_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(registry.occasion_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <AddItemDialog registryId={registry.id} />
            <Link
              href={`/registries/${slug}/share`}
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Link>
            <Link
              href={`/registries/${slug}/edit`}
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="mt-8">
        {items && items.length > 0 ? (
          <ItemGrid
            items={items}
            registrySlug={slug}
            isOwner={isOwner}
            isSubscriber={isSubscriber}
            currentUserId={user?.id}
            purchases={purchases}
            purchaserProfiles={purchaserProfiles}
          />
        ) : (
          <EmptyState
            icon={<Gift className="h-12 w-12" />}
            title="No items yet"
            description={
              isOwner
                ? "Add items to your registry so others know what you'd like."
                : "This registry doesn't have any items yet."
            }
            action={
              isOwner ? <AddItemDialog registryId={registry.id} /> : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
