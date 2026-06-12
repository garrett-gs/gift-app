"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Receives gift://add-item?url=... events fired by the iOS Share Extension
// (and any other deep link sources) and routes the webview to /add-item.
export function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    let detach: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appUrlOpen", (event) => {
        try {
          const incoming = new URL(event.url);
          // gift://add-item?url=...&title=...
          if (incoming.host !== "add-item") return;
          const target = new URL("/add-item", window.location.origin);
          incoming.searchParams.forEach((value, key) => {
            target.searchParams.set(key, value);
          });
          router.push(target.pathname + target.search);
        } catch {
          // Malformed deep link — ignore
        }
      });

      detach = () => {
        handle.remove();
      };
    })();

    return () => {
      detach?.();
    };
  }, [router]);

  return null;
}
