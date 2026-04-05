import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ found: false, error: "Vision API not configured" });
    }

    // Call Google Cloud Vision API with WEB_DETECTION
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: imageUrl } },
              features: [
                { type: "WEB_DETECTION", maxResults: 10 },
                { type: "PRODUCT_SEARCH_RESULTS", maxResults: 5 },
                { type: "LOGO_DETECTION", maxResults: 3 },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      console.error("Vision API error:", errText);
      return NextResponse.json({ found: false, error: "Vision API request failed" });
    }

    const visionData = await visionRes.json();
    const response = visionData.responses?.[0];

    if (!response) {
      return NextResponse.json({ found: false });
    }

    const webDetection = response.webDetection;
    const logos = response.logoAnnotations;

    // Extract best guess label (product name)
    let productName = "";
    if (webDetection?.bestGuessLabels?.length > 0) {
      productName = webDetection.bestGuessLabels[0].label || "";
    }

    // Get brand from logo detection
    let brand = "";
    if (logos?.length > 0) {
      brand = logos[0].description || "";
    }

    // Combine brand + product name
    if (brand && productName && !productName.toLowerCase().includes(brand.toLowerCase())) {
      productName = `${brand} ${productName}`;
    } else if (brand && !productName) {
      productName = brand;
    }

    // Find product URL from web entities or pages with matching images
    let productUrl = "";
    let productPrice: number | null = null;

    // Check pages with matching images (most likely product pages)
    if (webDetection?.pagesWithMatchingImages?.length > 0) {
      for (const page of webDetection.pagesWithMatchingImages) {
        const pageUrl = page.url || "";
        // Prefer shopping sites
        if (
          pageUrl.includes("amazon.com") ||
          pageUrl.includes("target.com") ||
          pageUrl.includes("walmart.com") ||
          pageUrl.includes("bestbuy.com") ||
          pageUrl.includes("nordstrom.com") ||
          pageUrl.includes("nike.com") ||
          pageUrl.includes("shop") ||
          pageUrl.includes("product")
        ) {
          productUrl = pageUrl;
          break;
        }
      }
      // If no shopping site found, use the first result
      if (!productUrl) {
        productUrl = webDetection.pagesWithMatchingImages[0].url || "";
      }
    }

    // If we found a product URL, try to scrape price from it
    if (productUrl) {
      try {
        const scrapeRes = await fetch(
          `${request.headers.get("origin") || "https://gift-app-lyart.vercel.app"}/api/scrape-url`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: productUrl }),
          }
        );
        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          if (scrapeData.price) productPrice = scrapeData.price;
          // Use the scraped title if our Vision name is too generic
          if (scrapeData.title && (!productName || productName.split(" ").length <= 2)) {
            productName = scrapeData.title;
          }
        }
      } catch {
        // Scrape failed, continue without price
      }
    }

    // Get a better image if available (full match from web)
    let betterImage = "";
    if (webDetection?.fullMatchingImages?.length > 0) {
      betterImage = webDetection.fullMatchingImages[0].url || "";
    }

    if (productName || productUrl) {
      return NextResponse.json({
        found: true,
        name: productName,
        price: productPrice,
        url: productUrl,
        betterImage,
        brand,
      });
    }

    return NextResponse.json({ found: false });
  } catch (e) {
    console.error("Image search error:", e);
    return NextResponse.json({ error: "Image search failed" }, { status: 500 });
  }
}
