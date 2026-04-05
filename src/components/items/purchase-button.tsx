"use client";

import { useState } from "react";
import { ShoppingCart, Clock, Undo2, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markPurchased, markPlanningToBuy, unmarkPurchased } from "@/actions/purchases";
import type { Purchase } from "@/lib/types";

interface PurchaseButtonProps {
  itemId: string;
  registrySlug: string;
  currentUserId: string;
  purchases: Purchase[];
}

export function PurchaseButton({
  itemId,
  registrySlug,
  currentUserId,
  purchases,
}: PurchaseButtonProps) {
  const [pending, setPending] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [chosenAction, setChosenAction] = useState<"bought" | "planning" | null>(null);

  const myPurchase = purchases.find((p) => p.purchaser_id === currentUserId);

  async function handleConfirm(anonymous: boolean) {
    setPending(true);
    if (chosenAction === "bought") {
      await markPurchased(itemId, registrySlug, 1, anonymous);
    } else {
      await markPlanningToBuy(itemId, registrySlug, anonymous);
    }
    setPending(false);
    setShowOptions(false);
    setChosenAction(null);
  }

  async function handleUnmark() {
    if (!myPurchase) return;
    setPending(true);
    await unmarkPurchased(myPurchase.id, registrySlug);
    setPending(false);
  }

  // Already marked
  if (myPurchase) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-green-700">
          {myPurchase.is_purchased ? "You bought this" : "Planning to buy"}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleUnmark}
          disabled={pending}
          title="Undo"
        >
          <Undo2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Asking: anonymous or not?
  if (showOptions) {
    return (
      <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
        <p className="text-xs font-medium">
          Do you want {chosenAction === "bought" ? "the recipient" : "them"} to know this is from you?
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => handleConfirm(false)}
            disabled={pending}
          >
            <Eye className="h-3.5 w-3.5" />
            Yes, show my name
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => handleConfirm(true)}
            disabled={pending}
          >
            <EyeOff className="h-3.5 w-3.5" />
            Keep anonymous
          </Button>
        </div>
        <button
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          onClick={() => { setShowOptions(false); setChosenAction(null); }}
        >
          Cancel
        </button>
      </div>
    );
  }

  // Initial state — pick bought or planning
  return (
    <div className="flex gap-2">
      <button
        className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
        onClick={() => { setChosenAction("bought"); setShowOptions(true); }}
        disabled={pending}
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        I bought this
      </button>
      <button
        className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
        onClick={() => { setChosenAction("planning"); setShowOptions(true); }}
        disabled={pending}
      >
        <Clock className="h-3.5 w-3.5" />
        Planning to buy
      </button>
    </div>
  );
}
