"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemForm } from "@/components/items/item-form";
import { updateItem } from "@/actions/items";
import type { RegistryItem } from "@/lib/types";

interface EditItemDialogProps {
  item: RegistryItem | null;
  registrySlug: string;
  onClose: () => void;
}

export function EditItemDialog({ item, registrySlug, onClose }: EditItemDialogProps) {
  const boundAction = async (formData: FormData) => {
    if (!item) return { success: false, error: "No item selected" };
    return await updateItem(item.id, registrySlug, formData);
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
        </DialogHeader>
        {item && (
          <ItemForm
            item={item}
            action={boundAction}
            submitLabel="Save Changes"
            onSuccess={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
