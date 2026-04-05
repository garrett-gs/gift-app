"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInviteLink } from "@/actions/invitations";

export function QuickShareButton({
  registryId,
  registryTitle,
}: {
  registryId: string;
  registryTitle: string;
}) {
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setPending(true);
    const result = await createInviteLink(registryId);
    setPending(false);

    if (!result.success) return;

    const url = `${window.location.origin}/invite/${result.data}`;
    const shareText = `Check out my gift registry "${registryTitle}" on GIFT!`;

    // Use native share sheet if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${registryTitle} - GIFT Registry`,
          text: shareText,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleShare}
      disabled={pending}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Link copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {pending ? "..." : "Share"}
        </>
      )}
    </Button>
  );
}
