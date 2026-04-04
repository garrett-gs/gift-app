"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ScanBarcode, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onProductFound: (product: {
    name: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    url?: string;
  }) => void;
}

export function BarcodeScanner({ onProductFound }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setScanning(false);
  }, []);

  async function lookupBarcode(barcode: string) {
    setLooking(true);
    setError(null);

    try {
      // Try UPC itemdb first
      const upcRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      if (upcRes.ok) {
        const upcData = await upcRes.json();
        if (upcData.items && upcData.items.length > 0) {
          const item = upcData.items[0];
          onProductFound({
            name: item.title || "",
            description: item.description || "",
            price: item.lowest_recorded_price ? Number(item.lowest_recorded_price) : undefined,
            imageUrl: item.images?.[0] || "",
            url: item.offers?.[0]?.link || "",
          });
          setLooking(false);
          return;
        }
      }

      // Fallback to Open Food Facts (good for food/grocery items)
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (offRes.ok) {
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          const p = offData.product;
          onProductFound({
            name: p.product_name || "",
            description: p.generic_name || "",
            imageUrl: p.image_url || "",
          });
          setLooking(false);
          return;
        }
      }

      // Nothing found — still pass the barcode
      setError(`No product found for barcode ${barcode}. You can fill in the details manually.`);
    } catch {
      setError("Could not look up product. Please fill in details manually.");
    }

    setLooking(false);
  }

  async function startScanning() {
    setError(null);
    setScanning(true);

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      reader.decodeFromVideoElement(videoRef.current!, (result, err) => {
        if (result) {
          const barcode = result.getText();
          stopScanning();
          lookupBarcode(barcode);
        }
      });
    } catch {
      setError("Camera access denied. Please allow camera access to scan barcodes.");
      setScanning(false);
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (looking) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Looking up product...</span>
      </div>
    );
  }

  return (
    <div>
      {scanning ? (
        <div className="relative overflow-hidden rounded-lg border">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-48 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-48 rounded border-2 border-white/80" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            className="absolute right-2 top-2"
            onClick={stopScanning}
          >
            <X className="h-3 w-3" />
          </Button>
          <p className="bg-black/50 py-1 text-center text-xs text-white">
            Point camera at barcode
          </p>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={startScanning}
        >
          <ScanBarcode className="h-4 w-4" />
          Scan Barcode
        </Button>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
