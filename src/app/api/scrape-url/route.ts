import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the page HTML
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GIFTBot/1.0; +https://gift-app.vercel.app)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Could not fetch URL" }, { status: 400 });
    }

    const html = await res.text();

    // Extract Open Graph and meta tags
    const ogImage = extractMeta(html, 'property="og:image"') ||
      extractMeta(html, "property='og:image'") ||
      extractMeta(html, 'name="og:image"');

    const ogTitle = extractMeta(html, 'property="og:title"') ||
      extractMeta(html, "property='og:title'") ||
      extractMeta(html, 'name="og:title"') ||
      extractTitle(html);

    const ogDescription = extractMeta(html, 'property="og:description"') ||
      extractMeta(html, "property='og:description'") ||
      extractMeta(html, 'name="description"');

    const ogPrice = extractMeta(html, 'property="product:price:amount"') ||
      extractMeta(html, 'property="og:price:amount"');

    // Make relative image URLs absolute
    let imageUrl = ogImage || "";
    if (imageUrl && !imageUrl.startsWith("http")) {
      const urlObj = new URL(url);
      imageUrl = imageUrl.startsWith("/")
        ? `${urlObj.origin}${imageUrl}`
        : `${urlObj.origin}/${imageUrl}`;
    }

    return NextResponse.json({
      title: ogTitle || "",
      description: ogDescription || "",
      image: imageUrl,
      price: ogPrice ? parseFloat(ogPrice) : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to scrape URL" }, { status: 500 });
  }
}

function extractMeta(html: string, attr: string): string | null {
  // Match both content="..." and content='...' formats, and handle attr before or after content
  const pattern1 = new RegExp(
    `<meta[^>]*${attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*content=["']([^"']*)["'][^>]*/?>`,
    "i"
  );
  const pattern2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*/?>`,
    "i"
  );

  const match1 = html.match(pattern1);
  if (match1) return match1[1];

  const match2 = html.match(pattern2);
  if (match2) return match2[1];

  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}
