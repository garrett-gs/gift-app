"use client";

import { Capacitor } from "@capacitor/core";

const ENABLED_KEY = "biometric-enabled";

export type BiometricSupport = {
  available: boolean;
  reason?: string;
};

export async function checkBiometricSupport(): Promise<BiometricSupport> {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, reason: "Only on iOS/Android" };
  }
  try {
    const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
    const info = await BiometricAuth.checkBiometry();
    if (info.isAvailable) return { available: true };
    return { available: false, reason: info.reason || "Biometry not set up on this device" };
  } catch (e) {
    return { available: false, reason: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function authenticate(reason = "Unlock GIFT"): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: "Cancel",
      iosFallbackTitle: "Use Passcode",
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}

export function isBiometricEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ENABLED_KEY) === "true";
}

export function setBiometricEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
}
