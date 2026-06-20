"use client";

import { registerPlugin } from "@capacitor/core";

// Mirrors the methods on ShareCredentialsPlugin.swift. Used to push the
// active Supabase session into the iOS App Group so the Share Extension
// can authenticate API calls without the WebView's session cookies.
export interface ShareCredentialsPlugin {
  set(options: {
    token?: string;
    userId?: string;
    defaultRegistryId?: string;
    apiBase?: string;
    expiresAt?: number;
  }): Promise<void>;
  clear(): Promise<void>;
}

export const ShareCredentials = registerPlugin<ShareCredentialsPlugin>("ShareCredentials");
