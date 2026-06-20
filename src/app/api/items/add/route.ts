import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

// Token-authenticated item add endpoint, designed for the iOS Share
// Extension which can't reach the WebView's HTTP-only session cookies.
// Pass `Authorization: Bearer <supabase access_token>` and a body with
// `{ url, registryId? }`. When registryId is omitted the item lands in
// the user's most-recently-created owned registry.

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  let body: { url?: string; registryId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  let registryId = body.registryId;
  if (!registryId) {
    const { data: registries, error: registryError } = await supabase
      .from("registries")
      .select("id, title")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (registryError) {
      return NextResponse.json({ error: "Could not look up registries" }, { status: 500 });
    }
    if (!registries || registries.length === 0) {
      return NextResponse.json(
        { error: "No registries yet — create one in GIFT first." },
        { status: 400 }
      );
    }
    registryId = registries[0].id;
  }

  const { data: registry, error: regErr } = await supabase
    .from("registries")
    .select("id, title, owner_id")
    .eq("id", registryId)
    .single();
  if (regErr || !registry || registry.owner_id !== user.id) {
    return NextResponse.json({ error: "Registry not found" }, { status: 404 });
  }

  // Reuse the existing scraper so we get the same name/price/image we'd
  // populate when the user fills the form in the app.
  const origin = new URL(request.url).origin;
  let scraped: {
    title?: string | null;
    description?: string | null;
    image?: string | null;
    price?: number | null;
  } = {};
  try {
    const scrapeRes = await fetch(`${origin}/api/scrape-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(12_000),
    });
    if (scrapeRes.ok) {
      scraped = await scrapeRes.json();
    }
  } catch {
    // Soft-fail — we'll insert with whatever we have. Better to save
    // something than to lose the link.
  }

  const name = (scraped.title || hostnameOf(url) || "Untitled").slice(0, 200);
  const description = scraped.description ? scraped.description.slice(0, 900) : null;
  const imageUrl = scraped.image || null;
  const price = typeof scraped.price === "number" && isFinite(scraped.price) ? scraped.price : null;

  const { data: inserted, error: insertError } = await supabase
    .from("registry_items")
    .insert({
      registry_id: registry.id,
      name,
      description,
      price,
      currency: "USD",
      url,
      image_url: imageUrl,
      priority: 3,
      quantity_desired: 1,
    })
    .select("id, name")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message || "Could not save item" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    itemId: inserted.id,
    itemName: inserted.name,
    registryId: registry.id,
    registryTitle: registry.title,
  });
}

function hostnameOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
