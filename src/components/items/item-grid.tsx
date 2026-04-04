"use client";

import { useState } from "react";
import { ItemCard } from "@/components/items/item-card";
import { EditItemDialog } from "@/components/items/edit-item-dialog";
import type { RegistryItem } from "@/lib/types";

interface ItemGridProps {
  items: RegistryItem[];
  registrySlug: string;
  isOwner: boolean;
}

export function ItemGrid({ items, registrySlug, isOwner }: ItemGridProps) {
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
