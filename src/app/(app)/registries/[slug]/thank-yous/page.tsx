import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, Gift, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

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

  return { title: `Thank Yous — ${registry?.title || "Registry"}` };
}

interface ThankYouPurchase {
  item_id: string;
  purchaser_id: string;
  is_purchased: boolean;
  is_anonymous: boolean;
  purchaser_name: string;
}

export default async function ThankYousPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get registry and verify ownership
  const { data: registry } = await supabase
    .from("registries")
    .select("id, title, owner_id")
    .eq("slug", slug)
    .single();

  if (!registry || registry.owner_id !== user?.id) {
    notFound();
  }

  // Get archived (received) items
  const { data: receivedItems } = await supabase
    .from("registry_items")
    .select("id, name, image_url, price")
    .eq("registry_id", registry.id)
    .eq("is_archived", true)
    .order("updated_at", { ascending: false });

  // Get purchases via RPC (bypasses RLS for owner on archived items)
  const { data: purchaseData } = await supabase.rpc("get_thank_you_purchases", {
    p_registry_id: registry.id,
  });

  const purchases = (purchaseData || []) as ThankYouPurchase[];

  // Build map of item_id -> purchasers
  const purchaseMap = new Map<string, { name: string; anonymous: boolean }[]>();
  for (const p of purchases) {
    const existing = purchaseMap.get(p.item_id) || [];
    existing.push({
      name: p.purchaser_name,
      anonymous: p.is_anonymous,
    });
    purchaseMap.set(p.item_id, existing);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/registries/${slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {registry.title}
      </Link>

      <h1 className="text-2xl font-bold">Thank Yous</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gifts you&apos;ve received — send a thank you!
      </p>

      <div className="mt-6">
        {receivedItems && receivedItems.length > 0 ? (
          <div className="space-y-3">
            {receivedItems.map((item) => {
              const purchasers = purchaseMap.get(item.id) || [];
              const namedPurchasers = purchasers.filter((p) => !p.anonymous);
              const anonymousCount = purchasers.filter((p) => p.anonymous).length;

              return (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                        <Gift className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.name}</p>
                      {item.price != null && (
                        <p className="text-xs text-muted-foreground">
                          ${Number(item.price).toFixed(2)}
                        </p>
                      )}
                      <div className="mt-1 space-y-0.5">
                        {namedPurchasers.length > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Heart className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                            <span className="text-muted-foreground">
                              From{" "}
                              <span className="font-medium text-foreground">
                                {namedPurchasers.map((p) => p.name).join(", ")}
                              </span>
                            </span>
                          </div>
                        )}
                        {anonymousCount > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground italic">
                              {anonymousCount === 1
                                ? "1 anonymous gift giver"
                                : `${anonymousCount} anonymous gift givers`}
                            </span>
                          </div>
                        )}
                        {purchasers.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">
                            No one claimed this gift
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-6 py-16 text-center">
            <Gift className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No received gifts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              When you mark items as received, they&apos;ll show up here
              with who bought them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
