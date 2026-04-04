import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, Calendar, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { OCCASION_TYPES } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

  const { data: items } = await supabase
    .from("registry_items")
    .select("*")
    .eq("registry_id", registry.id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-4"
              >
                <h3 className="font-semibold">{item.name}</h3>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
                {item.price && (
                  <p className="mt-2 text-sm font-medium">
                    ${Number(item.price).toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
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
              isOwner ? (
                <span className={cn(buttonVariants(), "gap-2 opacity-50 cursor-not-allowed")}>
                  <Plus className="h-4 w-4" />
                  Add Item (coming next)
                </span>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
