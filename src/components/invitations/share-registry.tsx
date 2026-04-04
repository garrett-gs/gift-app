"use client";

import { useState } from "react";
import { Copy, Check, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInviteLink, revokeInvite } from "@/actions/invitations";
import type { Invitation } from "@/lib/types";

interface ShareRegistryProps {
  registryId: string;
  registrySlug: string;
  existingInvites: Invitation[];
}

export function ShareRegistry({
  registryId,
  registrySlug,
  existingInvites,
}: ShareRegistryProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invites, setInvites] = useState(existingInvites);

  async function handleGenerateLink() {
    setGenerating(true);
    const result = await createInviteLink(registryId);
    setGenerating(false);

    if (result.success) {
      const url = `${window.location.origin}/invite/${result.data}`;
      setInviteUrl(url);
    }
  }

  async function handleCopy() {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleRevoke(inviteId: string) {
    const result = await revokeInvite(inviteId);
    if (result.success) {
      setInvites(invites.filter((i) => i.id !== inviteId));
    }
  }

  const activeInvites = invites.filter(
    (i) => !i.accepted_at && new Date(i.expires_at) > new Date()
  );

  return (
    <div className="space-y-8">
      {/* Generate new link */}
      <div>
        <h3 className="text-lg font-semibold">Invite link</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a link to share with family and friends. Anyone with the link
          can view your registry and mark items as purchased.
        </p>

        {inviteUrl ? (
          <div className="mt-4 flex gap-2">
            <Input value={inviteUrl} readOnly className="font-mono text-xs" />
            <Button variant="outline" onClick={handleCopy} className="shrink-0 gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            className="mt-4 gap-2"
            onClick={handleGenerateLink}
            disabled={generating}
          >
            <Link2 className="h-4 w-4" />
            {generating ? "Generating..." : "Generate invite link"}
          </Button>
        )}
      </div>

      {/* Active invites */}
      {activeInvites.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">Active invitations</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These invite links are currently active.
          </p>
          <div className="mt-4 space-y-3">
            {activeInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="text-sm">
                  <span className="font-mono text-xs text-muted-foreground">
                    ...{invite.invite_token.slice(-8)}
                  </span>
                  <span className="ml-3 text-xs text-muted-foreground">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleRevoke(invite.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
