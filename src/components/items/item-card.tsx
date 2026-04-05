"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { PurchaseButton } from "@/components/items/purchase-button";
import { PurchaseBadge } from "@/components/items/purchase-badge";
import type { RegistryItem, Purchase, Profile } from "@/lib/types";

interface ItemCardProps {
  item: RegistryItem;
  registrySlug: string;
  isOwner: boolean;
  isSubscriber: boolean;
  currentUserId?: string;
  purchases?: Purchase[];
  purchaserProfiles?: Profile[];
  onTap?: (item: RegistryItem) => void;
}

export function ItemCard({
  item,
  registrySlug,
  isOwner,
  isSubscriber,
  currentUserId,
  purchases = [],
  purchaserProfiles = [],
  onTap,
}: ItemCardProps) {
  const itemPurchases = purchases.filter((p) => p.item_id === item.id);
  const totalPurchased = itemPurchases.reduce((sum, p) => sum + p.quantity, 0);
  const fullyPurchased = totalPurchased >= item.quantity_desired;

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-colors ${
        fullyPurchased && !isOwner ? "bg-muted/50 opacity-75" : ""
      } ${onTap ? "cursor-pointer active:bg-muted/50" : ""}`}
      onClick={() => onTap?.(item)}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
    >
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.name}
          className="h-40 w-full object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{item.name}</h3>
          <Badge className={PRIORITY_COLORS[item.priority] || ""} variant="secondary">
            {PRIORITY_LABELS[item.priority]}
          </Badge>
        </div>

        {item.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3">
          {item.price != null && (
            <span className="text-sm font-medium">
              ${Number(item.price).toFixed(2)}
            </span>
          )}
          {item.quantity_desired > 1 && (
            <span className="text-xs text-muted-foreground">
              Qty: {isOwner ? item.quantity_desired : `${totalPurchased}/${item.quantity_desired}`}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="mt-2 text-xs text-muted-foreground italic">
            {item.notes}
          </p>
        )}

        {/* Purchase info — only visible to subscribers, NEVER to owner */}
        {!isOwner && isSubscriber && (
          <>
            <PurchaseBadge purchases={itemPurchases} profiles={purchaserProfiles} />
            {!fullyPurchased && currentUserId && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <PurchaseButton
                  itemId={item.id}
                  registrySlug={registrySlug}
                  currentUserId={currentUserId}
                  purchases={itemPurchases}
                />
              </div>
            )}
            {fullyPurchased && (
              <p className="mt-2 text-xs font-medium text-green-600">
                Fully purchased
              </p>
            )}
          </>
        )}

        {item.url && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View product
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
