import { NextResponse } from "next/server";

const MODEL = "claude-sonnet-4-6";

const PRODUCT_TOOL = {
  name: "record_product",
  description: "Record product details identified from the photo, for a gift registry entry.",
  input_schema: {
    type: "object" as const,
    properties: {
      identified: {
        type: "boolean",
        description: "Whether you can identify a specific product (or at least a clear product category) from the image.",
      },
      name: {
        type: "string",
        description: "Product name including brand and model if visible. Specific (e.g. 'Nike Air Max 90 Triple White'), not generic ('shoes'). Empty if not identified.",
      },
      brand: {
        type: "string",
        description: "Brand name if visible, otherwise empty string.",
      },
      category: {
        type: "string",
        enum: ["general", "clothing", "shoes", "electronics", "home", "toys", "books", "beauty", "sports", "other"],
        description: "Best-fit product category.",
      },
      description: {
        type: "string",
        description: "1-3 sentence description for a gift registry: appearance, color, material, style, and key features. Written so the gift recipient can confirm this is what they want. No commentary, no 'I see' phrasing.",
      },
      estimatedPriceLow: {
        type: "number",
        description: "Estimated low-end US dollar retail price. 0 if you cannot confidently estimate.",
      },
      estimatedPriceHigh: {
        type: "number",
        description: "Estimated high-end US dollar retail price. 0 if you cannot confidently estimate.",
      },
    },
    required: [
      "identified",
      "name",
      "brand",
      "category",
      "description",
      "estimatedPriceLow",
      "estimatedPriceHigh",
    ],
  },
};

const SYSTEM_PROMPT = `You identify products from photos for a gift registry app. The user uploaded a photo of something they want as a gift. Your job: fill in the registry entry from the photo.

Rules:
- Be specific. "Cream waffle-knit pullover sweater with crew neck" beats "sweater".
- Include brand and model when visible on the product or packaging.
- The description goes straight onto a wish list; write it for the recipient, not as commentary about the photo.
- If the photo is too ambiguous to identify even a category, set identified=false and leave the text fields empty.
- Estimate price only when you're confident (clear branded product). For generic items, return 0 for both bounds.`;

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ found: false, error: "Anthropic API not configured" });
    }

    // Fetch the image and base64-encode it so Anthropic doesn't need to reach our storage host.
    let mediaType = "image/jpeg";
    let base64 = "";
    try {
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
      if (!imgRes.ok) {
        return NextResponse.json({ found: false, error: "Could not load image" });
      }
      const contentType = imgRes.headers.get("content-type") || "";
      if (contentType.startsWith("image/")) mediaType = contentType.split(";")[0];
      const buffer = await imgRes.arrayBuffer();
      base64 = Buffer.from(buffer).toString("base64");
    } catch {
      return NextResponse.json({ found: false, error: "Could not load image" });
    }

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [PRODUCT_TOOL],
        tool_choice: { type: "tool", name: "record_product" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              { type: "text", text: "Identify this product and fill in the registry entry." },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("Anthropic API error:", apiRes.status, errText);
      return NextResponse.json({ found: false, error: `Anthropic API ${apiRes.status}` });
    }

    const apiData = await apiRes.json();
    const toolUse = apiData.content?.find((c: { type: string }) => c.type === "tool_use") as
      | { input: ProductResult }
      | undefined;
    if (!toolUse?.input) {
      return NextResponse.json({ found: false, error: "No tool output" });
    }

    const result = toolUse.input;
    if (!result.identified) {
      return NextResponse.json({ found: false });
    }

    // Midpoint of the price range, or whichever bound we have.
    let price: number | null = null;
    const low = Number(result.estimatedPriceLow) || 0;
    const high = Number(result.estimatedPriceHigh) || 0;
    if (low > 0 && high > 0) price = Math.round((low + high) / 2);
    else if (low > 0) price = low;
    else if (high > 0) price = high;

    return NextResponse.json({
      found: true,
      name: result.name || "",
      brand: result.brand || "",
      category: result.category || "general",
      description: result.description || "",
      price,
      url: "",
    });
  } catch (e) {
    console.error("Image search error:", e);
    return NextResponse.json({ error: "Image search failed" }, { status: 500 });
  }
}

type ProductResult = {
  identified: boolean;
  name: string;
  brand: string;
  category: string;
  description: string;
  estimatedPriceLow: number;
  estimatedPriceHigh: number;
};
