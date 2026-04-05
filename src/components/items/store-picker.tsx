"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Store {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
}

interface StorePickerProps {
  defaultStoreName?: string;
  defaultStoreAddress?: string;
  onStoreSelected: (store: { name: string; address: string } | null) => void;
}

export function StorePicker({
  defaultStoreName,
  defaultStoreAddress,
  onStoreSelected,
}: StorePickerProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(
    defaultStoreName
      ? { name: defaultStoreName, address: defaultStoreAddress || "", lat: 0, lng: 0, distance: 0 }
      : null
  );
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState(defaultStoreName || "");
  const [manualAddress, setManualAddress] = useState(defaultStoreAddress || "");
  const [locationDenied, setLocationDenied] = useState(false);

  function findNearbyStores() {
    if (!("geolocation" in navigator)) {
      setLocationDenied(true);
      setShowManual(true);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/nearby-stores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setStores(data.stores || []);
          }
        } catch {
          // Silently fail
        }
        setLoading(false);
        setLoaded(true);
      },
      () => {
        setLocationDenied(true);
        setShowManual(true);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function selectStore(store: Store) {
    setSelectedStore(store);
    setManualName(store.name);
    setManualAddress(store.address);
    onStoreSelected({ name: store.name, address: store.address });
  }

  function clearStore() {
    setSelectedStore(null);
    setManualName("");
    setManualAddress("");
    onStoreSelected(null);
  }

  function handleManualSave() {
    if (manualName) {
      onStoreSelected({ name: manualName, address: manualAddress });
      setSelectedStore({
        name: manualName,
        address: manualAddress,
        lat: 0,
        lng: 0,
        distance: 0,
      });
      setShowManual(false);
    }
  }

  // If a store is already selected, show it with option to change
  if (selectedStore) {
    return (
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedStore.name}</p>
          {selectedStore.address && (
            <p className="text-xs text-muted-foreground truncate">
              {selectedStore.address}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={clearStore}
          className="text-xs text-primary hover:underline shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!loaded && !loading && !showManual && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={findNearbyStores}
        >
          <Navigation className="h-4 w-4" />
          Find nearby stores
        </Button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Finding stores near you...
          </span>
        </div>
      )}

      {/* Store list */}
      {loaded && stores.length > 0 && (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
          {stores.map((store, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectStore(store)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
            >
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{store.name}</p>
                {store.address && (
                  <p className="text-xs text-muted-foreground truncate">
                    {store.address}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {store.distance < 1
                  ? `${Math.round(store.distance * 1000)}m`
                  : `${store.distance}km`}
              </span>
            </button>
          ))}
        </div>
      )}

      {loaded && stores.length === 0 && !showManual && (
        <p className="text-center text-xs text-muted-foreground">
          No stores found nearby
        </p>
      )}

      {/* Manual entry toggle */}
      {!showManual && (
        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="w-full text-center text-xs text-primary hover:underline"
        >
          {loaded ? "Enter store manually" : "Or type a store name"}
        </button>
      )}

      {/* Manual entry */}
      {showManual && (
        <div className="space-y-2">
          <Input
            placeholder="Store name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
          <Input
            placeholder="Address (optional)"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={!manualName}
          >
            Set store
          </Button>
        </div>
      )}

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="storeName" value={manualName} />
      <input type="hidden" name="storeAddress" value={manualAddress} />
    </div>
  );
}
