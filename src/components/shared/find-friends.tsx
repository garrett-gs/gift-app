"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, ContactRound, Loader2, Send, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { subscribe } from "@/actions/subscriptions";
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
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [pendingFollow, setPendingFollow] = useState<string | null>(null);
  const router = useRouter();

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

  // Contact Picker API (Android)
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

  // Manual email/phone entry
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

  // Invite friends via native share sheet
  async function handleInvite() {
    const shareText = "Join me on GIFT — the easiest way to share wish lists with family and friends! Sign up here:";
    const shareUrl = window.location.origin + "/signup";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join GIFT",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert("Invite link copied to clipboard!");
    }
  }

  async function handleFollowAll(friend: FoundFriend) {
    setPendingFollow(friend.id);
    const unfollowed = friend.registries.filter((r) => !r.isSubscribed);
    for (const reg of unfollowed) {
      await subscribe(reg.id);
    }
    setFollowingIds((prev) => new Set([...prev, friend.id]));
    setPendingFollow(null);
    router.refresh();
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
      {/* Sync contacts — Android gets one-tap, everyone gets manual */}
      <div className="space-y-3">
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

        <div className="space-y-2">
          <Label>
            {hasContactPicker
              ? "Or search by email / phone number"
              : "Find friends by email or phone number"}
          </Label>
          <Textarea
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={"friend@example.com\n555-123-4567\nanother@example.com"}
            rows={3}
          />
          <Button
            variant={hasContactPicker ? "outline" : "default"}
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
      </div>

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
                {friends.length}{" "}
                {friends.length === 1 ? "friend" : "friends"} on GIFT
              </p>
              {friends.map((friend) => {
                const allFollowed = friend.registries.every((r) => r.isSubscribed) || followingIds.has(friend.id);
                const hasRegistries = friend.registries.length > 0;
                const isFollowing = pendingFollow === friend.id;

                return (
                  <Card key={friend.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/people/${friend.id}`}>
                          <Avatar className="h-14 w-14">
                            {friend.avatarUrl && (
                              <AvatarImage
                                src={friend.avatarUrl}
                                alt={friend.displayName}
                              />
                            )}
                            <AvatarFallback className="text-lg">
                              {initials(friend.displayName)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/people/${friend.id}`} className="hover:underline">
                            <p className="font-semibold text-base">{friend.displayName}</p>
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {hasRegistries
                              ? `${friend.registries.length} ${friend.registries.length === 1 ? "registry" : "registries"}`
                              : "No registries yet"}
                          </p>
                        </div>
                        {hasRegistries && !allFollowed && (
                          <Button
                            size="sm"
                            className="gap-1.5 shrink-0"
                            onClick={() => handleFollowAll(friend)}
                            disabled={isFollowing}
                          >
                            {isFollowing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="h-3.5 w-3.5" />
                            )}
                            {isFollowing ? "Following..." : "Follow"}
                          </Button>
                        )}
                        {allFollowed && hasRegistries && (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 shrink-0">
                            <Check className="h-3.5 w-3.5" />
                            Following
                          </span>
                        )}
                      </div>

                      {/* Registry list */}
                      {hasRegistries && (
                        <div className="mt-3 ml-[4.5rem] space-y-1">
                          {friend.registries.map((reg) => (
                            <Link
                              key={reg.id}
                              href={`/registries/${reg.slug}`}
                              className="block text-sm text-primary hover:underline"
                            >
                              {reg.title}
                              {(reg.isSubscribed || followingIds.has(friend.id)) && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  (following)
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : (
            <div className="rounded-lg border border-dashed px-6 py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No friends found yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Invite them to join GIFT!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Invite Friends */}
      <Separator />
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Don&apos;t see who you&apos;re looking for?
        </p>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleInvite}
        >
          <Send className="h-4 w-4" />
          Invite Friends to GIFT
        </Button>
      </div>
    </div>
  );
}
