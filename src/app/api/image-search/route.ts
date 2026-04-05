import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    // Use Google's reverse image search endpoint
    // This fetches the Google Lens results page and extracts product info
    const searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`;

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({
        found: false,
        searchUrl: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`,
      });
    }

    const html = await res.text();

    // Try to extract product information from the Lens results
    const productName = extractProductName(html);
    const productPrice = extractPrice(html);
    const productUrl = extractProductUrl(html);

    if (productName) {
      return NextResponse.json({
        found: true,
        name: productName,
        price: productPrice,
        url: productUrl,
        searchUrl: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`,
      });
    }

    // If we can't parse the results, return the search URL so the user can look manually
    return NextResponse.json({
      found: false,
      searchUrl: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Image search failed" },
      { status: 500 }
    );
  }
}

function extractProductName(html: string): string | null {
  // Google Lens embeds product titles in various ways
  // Try data-item-title attribute
  const titleMatch = html.match(/data-item-title="([^"]+)"/);
  if (titleMatch) return decodeHtmlEntities(titleMatch[1]);

  // Try aria-label on product cards
  const ariaMatch = html.match(/aria-label="([^"]{10,100})"/);
  if (ariaMatch) return decodeHtmlEntities(ariaMatch[1]);

  // Try structured data
  const ldMatch = html.match(/"name"\s*:\s*"([^"]{5,100})"/);
  if (ldMatch) return decodeHtmlEntities(ldMatch[1]);

  return null;
}

function extractPrice(html: string): number | null {
  // Look for price patterns
  const priceMatch = html.match(/\$(\d+(?:\.\d{2})?)/);
  if (priceMatch) return parseFloat(priceMatch[1]);

  const priceDataMatch = html.match(/data-price="(\d+(?:\.\d{2})?)"/);
  if (priceDataMatch) return parseFloat(priceDataMatch[1]);

  return null;
}

function extractProductUrl(html: string): string | null {
  // Look for product links (shopping results)
  const urlMatch = html.match(/href="(https:\/\/(?:www\.)?(?:amazon|target|walmart|bestbuy|nike|nordstrom)[^"]+)"/i);
  if (urlMatch) return urlMatch[1];

  return null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
