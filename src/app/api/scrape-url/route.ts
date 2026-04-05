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

    // Detect if product has sizes
    const category = detectCategory(html, url);
    const availableSizes = extractSizes(html, category);

    return NextResponse.json({
      title: ogTitle || "",
      description: ogDescription || "",
      image: imageUrl,
      price: ogPrice ? parseFloat(ogPrice) : null,
      category,
      availableSizes,
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

function detectCategory(html: string, url: string): string | null {
  const lower = html.toLowerCase();
  const urlLower = url.toLowerCase();

  // Check URL patterns
  const shoeKeywords = ["/shoes", "/sneakers", "/boots", "/sandals", "/footwear"];
  if (shoeKeywords.some((k) => urlLower.includes(k))) return "shoes";

  const clothingKeywords = [
    "/clothing", "/apparel", "/shirts", "/pants", "/dresses",
    "/jackets", "/tops", "/bottoms", "/sweaters", "/hoodies",
  ];
  if (clothingKeywords.some((k) => urlLower.includes(k))) return "clothing";

  // Check page content for size selectors
  const sizePatterns = [
    /select[^>]*size/i,
    /data-size/i,
    /size-selector/i,
    /sizeSelector/i,
    /"size"\s*:/i,
    /aria-label="[^"]*size/i,
  ];

  const hasSizeSelector = sizePatterns.some((p) => p.test(html));
  if (!hasSizeSelector) return null;

  // Determine if it's shoes or clothing based on size values
  const shoePatterns = /\b(shoe\s*size|us\s*\d+\.?\d*|eu\s*\d+|uk\s*\d+)\b/i;
  if (shoePatterns.test(html)) return "shoes";

  // Check for clothing size labels
  const clothingSizePattern = /\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|Small|Medium|Large|X-Large)\b/;
  if (clothingSizePattern.test(html)) return "clothing";

  return null;
}

function extractSizes(html: string, category: string | null): string[] {
  if (!category) return [];

  const sizes: string[] = [];

  if (category === "clothing") {
    const clothingSizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
    for (const size of clothingSizes) {
      // Look for size options in the HTML
      const patterns = [
        new RegExp(`value=["']${size}["']`, "i"),
        new RegExp(`>${size}<`, "i"),
        new RegExp(`"${size}"`, "i"),
        new RegExp(`aria-label=["'][^"']*${size}[^"']*["']`, "i"),
      ];
      if (patterns.some((p) => p.test(html))) {
        sizes.push(size);
      }
    }
    // If we detected clothing but couldn't find specific sizes, return all standard sizes
    if (sizes.length === 0) return clothingSizes;
  }

  if (category === "shoes") {
    const shoeSizes = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14"];
    for (const size of shoeSizes) {
      const patterns = [
        new RegExp(`value=["']${size.replace(".", "\\.")}["']`),
        new RegExp(`>${size}<`),
        new RegExp(`"${size.replace(".", "\\.")}"`),
      ];
      if (patterns.some((p) => p.test(html))) {
        sizes.push(size);
      }
    }
    if (sizes.length === 0) return shoeSizes;
  }

  return sizes;
}
