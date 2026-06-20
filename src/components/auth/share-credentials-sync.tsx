"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Mounted inside the authenticated (app) layout. Pushes the user's
// current Supabase access token, user id, and default registry id into
// the iOS App Group so the Share Extension can POST to /api/items/add
// without relying on WebView cookies. Re-syncs on every Supabase auth
// state change (refresh, sign out, etc).
export function ShareCredentialsSync() {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { ShareCredentials } = await import("@/lib/share-credentials");
      const supabase = createClient();

      const apiBase = window.location.origin;

      const push = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) {
          try {
            await ShareCredentials.clear();
          } catch {
            // Plugin not registered (e.g. older build) — ignore.
          }
          return;
        }

        // First owned registry becomes the default destination for share-
        // extension adds. Cheaper than asking the user mid-share.
        const { data: registries } = await supabase
          .from("registries")
          .select("id")
          .eq("owner_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const defaultRegistryId = registries?.[0]?.id;

        try {
          await ShareCredentials.set({
            token: session.access_token,
            userId: session.user.id,
            apiBase,
            defaultRegistryId,
            expiresAt: session.expires_at,
          });
        } catch {
          // Plugin not registered — ignore.
        }
      };

      await push();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        void push();
      });
      unsubscribe = () => subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return null;
}
