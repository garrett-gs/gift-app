import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: "Location required" }, { status: 400 });
    }

    // Use OpenStreetMap Overpass API to find nearby shops/stores
    // Search within ~2km radius
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node["shop"](around:2000,${lat},${lng});
        node["amenity"="marketplace"](around:2000,${lat},${lng});
        way["shop"](around:2000,${lat},${lng});
      );
      out center tags 30;
    `.trim();

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "GIFTApp/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ stores: [] });
    }

    const data = await res.json();

    // Parse and deduplicate stores
    const storeMap = new Map<
      string,
      { name: string; address: string; lat: number; lng: number; distance: number }
    >();

    for (const element of data.elements || []) {
      const tags = element.tags || {};
      const name = tags.name;
      if (!name) continue;

      const storeLat = element.lat || element.center?.lat;
      const storeLng = element.lon || element.center?.lon;
      if (!storeLat || !storeLng) continue;

      const distance = getDistanceKm(lat, lng, storeLat, storeLng);

      // Build address from tags
      const addressParts = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:city"],
      ].filter(Boolean);
      const address = addressParts.length > 0 ? addressParts.join(" ") : "";

      // Use name as key to deduplicate
      const key = `${name.toLowerCase()}|${address.toLowerCase()}`;
      if (!storeMap.has(key)) {
        storeMap.set(key, {
          name,
          address,
          lat: storeLat,
          lng: storeLng,
          distance: Math.round(distance * 100) / 100,
        });
      }
    }

    // Sort by distance and return top 20
    const stores = Array.from(storeMap.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    return NextResponse.json({ stores });
  } catch {
    return NextResponse.json({ stores: [] });
  }
}

function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
