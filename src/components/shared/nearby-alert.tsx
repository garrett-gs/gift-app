"use client";

import { useState, useEffect } from "react";
import { MapPin, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NearbyItem {
  itemName: string;
  storeName: string;
  storeAddress: string;
  ownerName: string;
  registrySlug: string;
  distance: number; // km
}

interface NearbyAlertProps {
  storeItems: {
    item_name: string;
    store_name: string;
    store_address: string;
    store_lat: number;
    store_lng: number;
    owner_name: string;
    registry_slug: string;
  }[];
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

export function NearbyAlert({ storeItems }: NearbyAlertProps) {
  const [nearbyItems, setNearbyItems] = useState<NearbyItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const NEARBY_RADIUS_KM = 8; // ~5 miles

  function checkNearby() {
    if (!storeItems.length) return;
    setChecking(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearby: NearbyItem[] = [];

        for (const si of storeItems) {
          const dist = getDistanceKm(latitude, longitude, si.store_lat, si.store_lng);
          if (dist <= NEARBY_RADIUS_KM) {
            nearby.push({
              itemName: si.item_name,
              storeName: si.store_name,
              storeAddress: si.store_address,
              ownerName: si.owner_name,
              registrySlug: si.registry_slug,
              distance: Math.round(dist * 10) / 10,
            });
          }
        }

        // Sort by distance
        nearby.sort((a, b) => a.distance - b.distance);
        setNearbyItems(nearby);
        setChecking(false);
      },
      () => {
        setLocationDenied(true);
        setChecking(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  // Check on mount
  useEffect(() => {
    if (storeItems.length > 0 && "geolocation" in navigator) {
      checkNearby();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (dismissed || locationDenied || storeItems.length === 0) return null;
  if (checking) return null;
  if (nearbyItems.length === 0) return null;

  // Group by store
  const byStore = new Map<string, NearbyItem[]>();
  for (const item of nearbyItems) {
    const key = `${item.storeName}|${item.storeAddress}`;
    if (!byStore.has(key)) byStore.set(key, []);
    byStore.get(key)!.push(item);
  }

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-primary/10 p-2">
              <Navigation className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                You're near {byStore.size === 1 ? "a store" : `${byStore.size} stores`} with gift ideas!
              </p>
              <div className="mt-2 space-y-3">
                {Array.from(byStore.entries()).map(([key, items]) => (
                  <div key={key}>
                    <p className="flex items-center gap-1 text-xs font-medium">
                      <MapPin className="h-3 w-3" />
                      {items[0].storeName} — {items[0].distance} km away
                    </p>
                    <ul className="mt-1 space-y-0.5 pl-4">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          {item.ownerName} wants: <strong>{item.itemName}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
