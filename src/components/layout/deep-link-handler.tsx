"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Receives URLs targeting the gift app (gift:// custom scheme OR
// https://<our-domain>/add-item Universal Links) and routes the webview
// to /add-item. Sources include the iOS Share Extension's App Group
// hand-off (replayed by AppDelegate on launch) and live Universal Link
// taps.
export function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    let detach: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");

      const handleUrl = (urlStr: string) => {
        try {
          const incoming = new URL(urlStr);
          let path = "";
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
      };

      // Backstop the JS-subscribed-too-late race. If AppDelegate fired the URL
      // through Capacitor before this effect ran, the appUrlOpen event was
      // broadcast to nobody — but Capacitor still parks the URL in lastUrl,
      // which getLaunchUrl() returns. Same code path handles cold-launch
      // Universal Links.
      try {
        const launch = await App.getLaunchUrl();
        if (launch?.url) handleUrl(launch.url);
      } catch {
        // App plugin not registered or platform doesn't support — ignore
      }

      const handle = await App.addListener("appUrlOpen", (event) => {
        handleUrl(event.url);
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
