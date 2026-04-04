"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { PurchaseButton } from "@/components/items/purchase-button";
import { PurchaseBadge } from "@/components/items/purchase-badge";
import type { RegistryItem, Purchase, Profile } from "@/lib/types";
import { useState } from "react";
import { deleteItem } from "@/actions/items";

interface ItemCardProps {
  item: RegistryItem;
  registrySlug: string;
  isOwner: boolean;
  isSubscriber: boolean;
  currentUserId?: string;
  purchases?: Purchase[];
  purchaserProfiles?: Profile[];
  onEdit?: (item: RegistryItem) => void;
}

export function ItemCard({
  item,
  registrySlug,
  isOwner,
  isSubscriber,
  currentUserId,
  purchases = [],
  purchaserProfiles = [],
  onEdit,
}: ItemCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteItem(item.id, registrySlug);
    setDeleting(false);
  }

  const itemPurchases = purchases.filter((p) => p.item_id === item.id);
  const totalPurchased = itemPurchases.reduce((sum, p) => sum + p.quantity, 0);
  const fullyPurchased = totalPurchased >= item.quantity_desired;

  return (
    <div className={`rounded-lg border p-4 transition-colors ${fullyPurchased && !isOwner ? "bg-muted/50 opacity-75" : ""}`}>
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
            <div className="mt-3">
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

      <div className="mt-3 flex items-center gap-2">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View product
          </a>
        )}

        {isOwner && (
          <div className="ml-auto flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {!confirmDelete ? (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "..." : "Delete"}
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
