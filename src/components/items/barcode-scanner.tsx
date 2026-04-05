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
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null);

  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setScanning(false);
  }, []);

  async function lookupBarcode(barcode: string) {
    setLooking(true);
    setScannedCode(barcode);
    setError(null);

    try {
      const res = await fetch("/api/barcode-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.found) {
          onProductFound({
            name: data.name,
            description: data.description || undefined,
            price: data.price || undefined,
            imageUrl: data.imageUrl || undefined,
            url: data.url || undefined,
          });
          setLooking(false);
          setScannedCode(null);
          return;
        }
      }

      setError(
        `No product found for barcode ${barcode}. Fill in the name and snap a photo!`
      );
    } catch {
      setError("Lookup failed. Fill in the details manually.");
    }

    setLooking(false);
  }

  async function startScanning() {
    setError(null);
    setScannedCode(null);
    setScanning(true);

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();

      // Let ZXing handle the camera — more reliable on iOS
      const controls = await reader.decodeFromVideoDevice(
        undefined, // use default camera (rear on mobile)
        videoRef.current!,
        (result, err) => {
          if (result) {
            const barcode = result.getText();
            controls.stop();
            controlsRef.current = null;
            setScanning(false);
            lookupBarcode(barcode);
          }
          // Ignore errors — they fire continuously until a barcode is found
        }
      );

      controlsRef.current = controls;
    } catch (e) {
      setError(
        "Camera access denied. Please allow camera access in your browser settings."
      );
      setScanning(false);
    }
  }

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  if (looking) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          Looking up barcode {scannedCode}...
        </span>
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
            style={{ transform: "scaleX(1)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-20 w-44 rounded border-2 border-white/80 shadow-lg" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            className="absolute right-2 top-2 z-10"
            onClick={stopScanning}
          >
            <X className="h-3 w-3" />
          </Button>
          <p className="bg-black/60 py-1.5 text-center text-xs text-white font-medium">
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
