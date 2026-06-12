"use client";

import { useEffect, useState } from "react";
import { ScanFace, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticate, isBiometricEnabled } from "@/lib/biometric";

type GateState = "checking" | "prompting" | "failed" | "unlocked";

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || !isBiometricEnabled()) {
        if (!cancelled) setState("unlocked");
        return;
      }
      if (!cancelled) setState("prompting");
      const ok = await authenticate("Unlock GIFT");
      if (cancelled) return;
      setState(ok ? "unlocked" : "failed");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function retry() {
    setState("prompting");
    const ok = await authenticate("Unlock GIFT");
    setState(ok ? "unlocked" : "failed");
  }

  if (state === "unlocked") return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background px-4">
      <ScanFace className="h-14 w-14 text-muted-foreground" />
      {state === "checking" || state === "prompting" ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{state === "prompting" ? "Waiting for Face ID…" : "Loading…"}</span>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Authentication cancelled or failed.</p>
          <Button onClick={retry}>Try again</Button>
        </>
      )}
    </div>
  );
}
