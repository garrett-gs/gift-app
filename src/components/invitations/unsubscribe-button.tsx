"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { unsubscribe } from "@/actions/subscriptions";

export function UnsubscribeButton({ registryId }: { registryId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleUnsubscribe() {
    setPending(true);
    await unsubscribe(registryId);
    setPending(false);
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
        }}
        title="Unsubscribe"
      >
        <UserMinus className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      <Button
        variant="destructive"
        size="xs"
        onClick={handleUnsubscribe}
        disabled={pending}
      >
        {pending ? "..." : "Unsubscribe"}
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => setConfirming(false)}
      >
        Cancel
      </Button>
    </div>
  );
}
