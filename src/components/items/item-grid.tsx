"use client";

import { useState } from "react";
import { ItemCard } from "@/components/items/item-card";
import { EditItemDialog } from "@/components/items/edit-item-dialog";
import type { RegistryItem, Purchase, Profile } from "@/lib/types";

interface ItemGridProps {
  items: RegistryItem[];
  registrySlug: string;
  isOwner: boolean;
  isSubscriber: boolean;
  currentUserId?: string;
  purchases?: Purchase[];
  purchaserProfiles?: Profile[];
}

export function ItemGrid({
  items,
  registrySlug,
  isOwner,
  isSubscriber,
  currentUserId,
  purchases = [],
  purchaserProfiles = [],
}: ItemGridProps) {
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            registrySlug={registrySlug}
            isOwner={isOwner}
            isSubscriber={isSubscriber}
            currentUserId={currentUserId}
            purchases={purchases}
            purchaserProfiles={purchaserProfiles}
            onEdit={isOwner ? setEditingItem : undefined}
          />
        ))}
      </div>

      {isOwner && (
        <EditItemDialog
          item={editingItem}
          registrySlug={registrySlug}
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  );
}
