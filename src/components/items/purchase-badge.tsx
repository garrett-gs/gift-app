import { Check, Clock } from "lucide-react";
import type { Purchase, Profile } from "@/lib/types";

interface PurchaseBadgeProps {
  purchases: Purchase[];
  profiles: Profile[];
}

export function PurchaseBadge({ purchases, profiles }: PurchaseBadgeProps) {
  if (purchases.length === 0) return null;

  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]));

  return (
    <div className="mt-2 space-y-1">
      {purchases.map((purchase) => {
        const name = profileMap.get(purchase.purchaser_id) || "Someone";
        return (
          <div
            key={purchase.id}
            className="flex items-center gap-1.5 text-xs"
          >
            {purchase.is_purchased ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Clock className="h-3 w-3 text-amber-500" />
            )}
            <span className="text-muted-foreground">
              {name} {purchase.is_purchased ? "bought this" : "plans to buy"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
