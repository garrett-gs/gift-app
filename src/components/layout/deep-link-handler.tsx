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
          let path = "";
          // Two shapes can arrive here:
          //  1. gift://add-item?url=...    (custom-scheme fallback)
          //  2. https://<our-domain>/add-item?url=...  (Universal Link)
          if (incoming.protocol === "gift:" && incoming.host === "add-item") {
            path = "/add-item";
          } else if (incoming.pathname.startsWith("/add-item")) {
            path = incoming.pathname;
          } else {
            return;
          }
          const target = new URL(path, window.location.origin);
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
