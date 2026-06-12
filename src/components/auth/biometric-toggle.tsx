"use client";

import { useEffect, useState } from "react";
import { ScanFace, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  authenticate,
  checkBiometricSupport,
  isBiometricEnabled,
  setBiometricEnabled,
} from "@/lib/biometric";

export function BiometricToggle() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | undefined>();
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    (async () => {
      const support = await checkBiometricSupport();
      setAvailable(support.available);
      setReason(support.reason);
      setEnabled(isBiometricEnabled());
    })();
  }, []);

  async function toggle() {
    setPending(true);
    if (enabled) {
      setBiometricEnabled(false);
      setEnabled(false);
      setPending(false);
      return;
    }
    // Confirm with Face ID before enabling so we know it actually works on this device
    const ok = await authenticate("Enable Face ID sign-in");
    if (ok) {
      setBiometricEnabled(true);
      setEnabled(true);
    }
    setPending(false);
  }

  if (available === null) return null;
  if (!available) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <ScanFace className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Face ID sign-in</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {reason || "Not available on this device."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <ScanFace className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Face ID sign-in</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {enabled
              ? "On — unlock the app with Face ID each launch."
              : "Off — turn on to require Face ID when opening the app."}
          </p>
        </div>
        <Button onClick={toggle} disabled={pending} variant={enabled ? "outline" : "default"} size="sm">
          {enabled ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" />
              Disable
            </>
          ) : (
            "Enable"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
