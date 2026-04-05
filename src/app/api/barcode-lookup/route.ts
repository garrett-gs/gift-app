import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { barcode } = await request.json();

    if (!barcode || typeof barcode !== "string") {
      return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
    }

    // Try UPC itemdb
    try {
      const upcRes = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "GIFTApp/1.0",
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (upcRes.ok) {
        const upcData = await upcRes.json();
        if (upcData.items && upcData.items.length > 0) {
          const item = upcData.items[0];
          return NextResponse.json({
            found: true,
            name: item.title || "",
            description: item.description || "",
            price: item.lowest_recorded_price
              ? Number(item.lowest_recorded_price)
              : null,
            imageUrl: item.images?.[0] || "",
            url: item.offers?.[0]?.link || "",
            source: "upcitemdb",
          });
        }
      }
    } catch {
      // Continue to next source
    }

    // Try Open Food Facts
    try {
      const offRes = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          headers: { "User-Agent": "GIFTApp/1.0" },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (offRes.ok) {
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          const p = offData.product;
          return NextResponse.json({
            found: true,
            name: p.product_name || p.product_name_en || "",
            description: p.generic_name || p.categories || "",
            price: null,
            imageUrl:
              p.image_front_url ||
              p.image_url ||
              p.image_front_small_url ||
              "",
            url: `https://world.openfoodfacts.org/product/${barcode}`,
            source: "openfoodfacts",
          });
        }
      }
    } catch {
      // Continue to next source
    }

    // Try Open Beauty Facts (cosmetics/beauty products)
    try {
      const obfRes = await fetch(
        `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`,
        {
          headers: { "User-Agent": "GIFTApp/1.0" },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (obfRes.ok) {
        const obfData = await obfRes.json();
        if (obfData.status === 1 && obfData.product) {
          const p = obfData.product;
          return NextResponse.json({
            found: true,
            name: p.product_name || "",
            description: p.generic_name || "",
            price: null,
            imageUrl: p.image_front_url || p.image_url || "",
            url: `https://world.openbeautyfacts.org/product/${barcode}`,
            source: "openbeautyfacts",
          });
        }
      }
    } catch {
      // Continue
    }

    return NextResponse.json({
      found: false,
      barcode,
      message: "Product not found in our databases.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to look up barcode" },
      { status: 500 }
    );
  }
}
