"use client";

import { useState, useRef } from "react";
import { Search, Users, ContactRound, Loader2, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { parseVCF } from "@/lib/parse-vcf";
import Link from "next/link";

interface FoundFriend {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  registries: {
    id: string;
    title: string;
    slug: string;
    isSubscribed: boolean;
  }[];
}

export function FindFriends() {
  const [friends, setFriends] = useState<FoundFriend[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasContactPicker =
    typeof window !== "undefined" && "contacts" in navigator;

  async function syncContacts(
    contacts: { emails: string[]; phones: string[] }[]
  ) {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch("/api/sync-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });

      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends);
        setSyncCount(data.synced);
        setSynced(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Failed to sync contacts. Please try again.");
    }

    setSyncing(false);
  }

  // Method 1: Contact Picker API (Android)
  async function handleContactPicker() {
    try {
      // @ts-expect-error Contact Picker API
      const picked = await navigator.contacts.select(["email", "tel"], {
        multiple: true,
      });
      const contacts = picked.map(
        (c: { email?: string[]; tel?: string[] }) => ({
          emails: c.email || [],
          phones: c.tel || [],
        })
      );

      if (contacts.length > 0) {
        await syncContacts(contacts);
      }
    } catch {
      // User cancelled
    }
  }

  // Method 2: VCF file import (iPhone workaround)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsed = parseVCF(text);

    if (parsed.length === 0) {
      setError("No contacts found in that file. Make sure it's a .vcf file.");
      return;
    }

    const contacts = parsed.map((c) => ({
      emails: c.emails,
      phones: c.phones,
    }));

    await syncContacts(contacts);
  }

  // Method 3: Manual email/phone entry
  async function handleManualSearch() {
    const entries = emailInput
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (entries.length === 0) {
      setError("Please enter at least one email or phone number.");
      return;
    }

    const contacts = entries.map((entry) => ({
      emails: entry.includes("@") ? [entry] : [],
      phones: !entry.includes("@") ? [entry] : [],
    }));

    await syncContacts(contacts);
  }

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Primary actions */}
      <div className="space-y-3">
        {/* Contact Picker — Android */}
        {hasContactPicker && (
          <Button
            className="w-full gap-2 h-12 text-base"
            onClick={handleContactPicker}
            disabled={syncing}
          >
            <ContactRound className="h-5 w-5" />
            {syncing ? "Syncing contacts..." : "Sync My Contacts"}
          </Button>
        )}

        {/* VCF Import — works on iPhone */}
        <Button
          variant={hasContactPicker ? "outline" : "default"}
          className="w-full gap-2 h-12 text-base"
          onClick={() => fileInputRef.current?.click()}
          disabled={syncing}
        >
          <Upload className="h-5 w-5" />
          {syncing ? "Importing..." : "Import Contacts File (.vcf)"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".vcf,text/vcard"
          className="hidden"
          onChange={handleFileUpload}
        />

        {!hasContactPicker && (
          <p className="text-xs text-muted-foreground text-center">
            On iPhone: Settings &gt; Contacts &gt; Export, then upload the file here
          </p>
        )}

        {/* Manual entry toggle */}
        <button
          type="button"
          onClick={() => setShowManual(!showManual)}
          className="w-full text-center text-xs text-primary hover:underline"
        >
          {showManual ? "Hide manual entry" : "Or enter emails/phone numbers manually"}
        </button>
      </div>

      {/* Manual entry */}
      {showManual && (
        <div className="space-y-3">
          <Label>Enter emails or phone numbers</Label>
          <Textarea
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={"friend@example.com\n555-123-4567\nanother@example.com"}
            rows={4}
          />
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleManualSearch}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {syncing ? "Searching..." : "Find Friends"}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Sync status */}
      {synced && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
          <Check className="h-4 w-4 text-green-600" />
          <p className="text-sm text-muted-foreground">
            {syncCount} contacts synced. We&apos;ll notify you when new contacts join GIFT.
          </p>
        </div>
      )}

      {/* Results */}
      {synced && (
        <div className="space-y-4">
          {friends.length > 0 ? (
            <>
              <p className="text-sm font-medium">
                {friends.length} {friends.length === 1 ? "friend" : "friends"} on GIFT
              </p>
              {friends.map((friend) => (
                <Card key={friend.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12">
                      {friend.avatarUrl && (
                        <AvatarImage
                          src={friend.avatarUrl}
                          alt={friend.displayName}
                        />
                      )}
                      <AvatarFallback>
                        {initials(friend.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{friend.displayName}</p>
                      {friend.registries.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {friend.registries.map((reg) => (
                            <Link
                              key={reg.id}
                              href={`/registries/${reg.slug}`}
                              className="block text-xs text-primary hover:underline"
                            >
                              {reg.title}
                              {reg.isSubscribed && (
                                <span className="ml-1 text-muted-foreground">
                                  (following)
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No public registries yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="rounded-lg border border-dashed px-6 py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No friends found yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We&apos;ll notify you when someone from your contacts joins GIFT!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
