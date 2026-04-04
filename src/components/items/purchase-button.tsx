"use client";

import { useState } from "react";
import { ShoppingCart, Clock, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const myPurchase = purchases.find((p) => p.purchaser_id === currentUserId);

  async function handleMarkPurchased() {
    setPending(true);
    await markPurchased(itemId, registrySlug);
    setPending(false);
  }

  async function handlePlanningToBuy() {
    setPending(true);
    await markPlanningToBuy(itemId, registrySlug);
    setPending(false);
  }

  async function handleUnmark() {
    if (!myPurchase) return;
    setPending(true);
    await unmarkPurchased(myPurchase.id, registrySlug);
    setPending(false);
  }

  // If current user already marked this item
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-50" disabled={pending}>
        <ShoppingCart className="h-3 w-3" />
        {pending ? "..." : "I'll get this"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleMarkPurchased} className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          I bought this
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePlanningToBuy} className="gap-2">
          <Clock className="h-4 w-4" />
          Planning to buy
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
