import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Calendar, Gift, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AddItemDialog } from "@/components/items/add-item-dialog";
import { ItemGrid } from "@/components/items/item-grid";
import { QuickShareButton } from "@/components/invitations/quick-share-button";
import { SubscribeButton } from "@/components/invitations/subscribe-button";
import { OCCASION_TYPES } from "@/lib/constants";
import { buttonVariants } from "@/lib/button-variants";
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

  // Get owner profile for display to non-owners
  let ownerName = "";
  if (!isOwner) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", registry.owner_id)
      .single();
    ownerName = ownerProfile?.display_name || "Someone";
  }

  const occasionLabel = OCCASION_TYPES.find(
    (o) => o.value === registry.occasion
  )?.label;

  return (
    <div>
      {/* Back to person's profile for non-owners */}
      {!isOwner && (
        <Link
          href={`/people/${registry.owner_id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {ownerName}&apos;s Profile
        </Link>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{registry.title}</h1>
          {registry.is_public && (
            <Badge variant="secondary">Public</Badge>
          )}
        </div>
        {!isOwner && (
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            by {ownerName}
          </p>
        )}
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

        {isOwner && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <AddItemDialog registryId={registry.id} />
            <QuickShareButton registryId={registry.id} registryTitle={registry.title} />
            <Link
              href={`/registries/${slug}/edit`}
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <Link
              href={`/registries/${slug}/thank-yous`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Heart className="h-3 w-3" />
              Thank Yous
            </Link>
          </div>
        )}

        {/* Non-owner, not yet subscribed — show follow button */}
        {!isOwner && !isSubscriber && user && (
          <div className="mt-4 rounded-lg border border-dashed p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Follow this registry to mark items as purchased and coordinate gifts with others.
            </p>
            <SubscribeButton registryId={registry.id} />
          </div>
        )}

        {/* Subscriber confirmation */}
        {!isOwner && isSubscriber && (
          <p className="mt-3 text-xs text-green-600 font-medium">
            You&apos;re following this registry — tap &ldquo;I&apos;ll get this&rdquo; on any item to claim it
          </p>
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
