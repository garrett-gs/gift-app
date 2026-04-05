import { createClient } from "@/lib/supabase/server";
import { QuickAddItem } from "@/components/items/quick-add-item";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Item",
};

type Props = {
  searchParams: Promise<{ title?: string; text?: string; url?: string }>;
};

export default async function AddItemPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's registries so they can pick which one to add to
  const { data: registries } = await supabase
    .from("registries")
    .select("id, title, slug, occasion")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  // Extract URL from shared text if not in url param
  let sharedUrl = params.url || "";
  if (!sharedUrl && params.text) {
    const urlMatch = params.text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) sharedUrl = urlMatch[0];
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Add Item</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {sharedUrl ? "Adding from shared link" : "Add something to your registry"}
      </p>
      <div className="mt-6">
        <QuickAddItem
          registries={registries || []}
          sharedUrl={sharedUrl}
          sharedTitle={params.title || ""}
        />
      </div>
    </div>
  );
}
