"use client";

import { useState } from "react";
import { ExternalLink, MapPin, GiftIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { PurchaseButton } from "@/components/items/purchase-button";
import { PurchaseBadge } from "@/components/items/purchase-badge";
import { markReceived } from "@/actions/items";
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
  const [receiving, setReceiving] = useState(false);
  const [received, setReceived] = useState(false);
  const itemPurchases = purchases.filter((p) => p.item_id === item.id);
  const totalPurchased = itemPurchases.reduce((sum, p) => sum + p.quantity, 0);
  const fullyPurchased = totalPurchased >= item.quantity_desired;

  async function handleMarkReceived(e: React.MouseEvent) {
    e.stopPropagation();
    setReceiving(true);
    const result = await markReceived(item.id, registrySlug);
    if (result.success) {
      setReceived(true);
    }
    setReceiving(false);
  }

  if (received) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <div>
          <GiftIcon className="mx-auto h-8 w-8 text-green-600" />
          <p className="mt-2 text-sm font-medium text-green-600">Received!</p>
        </div>
      </div>
    );
  }

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

        {item.store_name && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {item.store_name}{item.store_address ? ` — ${item.store_address}` : ""}
          </p>
        )}

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
              className={`inline-flex items-center gap-1 text-xs hover:underline ${
                !isOwner ? "rounded-md bg-primary/10 px-2.5 py-1.5 font-medium text-primary" : "text-primary"
              }`}
            >
              <ExternalLink className="h-3 w-3" />
              {!isOwner ? "Buy this item" : "View product"}
            </a>
          </div>
        )}

        {/* Mark as received — only visible to owner */}
        {isOwner && (
          <div className="mt-3 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleMarkReceived}
              disabled={receiving}
              className="w-full flex items-center justify-center gap-1.5 rounded-md bg-green-50 py-2 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              {receiving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <GiftIcon className="h-3.5 w-3.5" />
              )}
              {receiving ? "Removing..." : "Got it! Mark as received"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
