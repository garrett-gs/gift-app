"use client";

import { useState } from "react";
import { Search, Users, ContactRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface FoundFriend {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  registries: {
    id: string;
    title: string;
    slug: string;
    is_public: boolean;
    isSubscribed: boolean;
  }[];
}

export function FindFriends() {
  const [friends, setFriends] = useState<FoundFriend[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Check if Contact Picker API is available
  const hasContactPicker = typeof window !== "undefined" && "contacts" in navigator;

  async function searchEmails(emails: string[]) {
    setSearching(true);
    setError(null);

    try {
      const res = await fetch("/api/find-friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Failed to search. Please try again.");
    }

    setSearching(false);
    setSearched(true);
  }

  async function handleContactPicker() {
    try {
      // @ts-expect-error Contact Picker API not in TypeScript types
      const contacts = await navigator.contacts.select(["email"], {
        multiple: true,
      });
      const emails = contacts
        .flatMap((c: { email?: string[] }) => c.email || [])
        .filter(Boolean);

      if (emails.length > 0) {
        await searchEmails(emails);
      }
    } catch {
      // User cancelled or API unavailable
    }
  }

  async function handleManualSearch() {
    const emails = emailInput
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));

    if (emails.length === 0) {
      setError("Please enter at least one email address.");
      return;
    }

    await searchEmails(emails);
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
      {/* Contact Picker (Android/Chrome) */}
      {hasContactPicker && (
        <Button
          className="w-full gap-2"
          onClick={handleContactPicker}
          disabled={searching}
        >
          <ContactRound className="h-4 w-4" />
          {searching ? "Searching..." : "Search My Contacts"}
        </Button>
      )}

      {/* Manual email entry (always available) */}
      <div className="space-y-3">
        <Label>{hasContactPicker ? "Or enter emails manually" : "Enter email addresses"}</Label>
        <Textarea
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder={"friend@example.com\nanother@example.com"}
          rows={3}
        />
        <Button
          variant={hasContactPicker ? "outline" : "default"}
          className="w-full gap-2"
          onClick={handleManualSearch}
          disabled={searching}
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {searching ? "Searching..." : "Find Friends"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          {friends.length > 0 ? (
            <>
              <p className="text-sm font-medium">
                Found {friends.length} {friends.length === 1 ? "friend" : "friends"} on GIFT
              </p>
              {friends.map((friend) => (
                <Card key={friend.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12">
                      {friend.avatarUrl && (
                        <AvatarImage src={friend.avatarUrl} alt={friend.displayName} />
                      )}
                      <AvatarFallback>{initials(friend.displayName)}</AvatarFallback>
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
                                <span className="ml-1 text-muted-foreground">(following)</span>
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
              <p className="mt-3 text-sm font-medium">No friends found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                None of those emails are on GIFT yet. Invite them!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
