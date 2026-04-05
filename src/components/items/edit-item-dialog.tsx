"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ItemForm } from "@/components/items/item-form";
import { updateItem, deleteItem } from "@/actions/items";
import type { RegistryItem } from "@/lib/types";

interface EditItemDialogProps {
  item: RegistryItem | null;
  registrySlug: string;
  onClose: () => void;
}

export function EditItemDialog({ item, registrySlug, onClose }: EditItemDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const boundAction = async (formData: FormData) => {
    if (!item) return { success: false, error: "No item selected" };
    return await updateItem(item.id, registrySlug, formData);
  };

  async function handleDelete() {
    if (!item) return;
    setDeleting(true);
    await deleteItem(item.id, registrySlug);
    setDeleting(false);
    setConfirmDelete(false);
    onClose();
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setConfirmDelete(false);
      onClose();
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
        </DialogHeader>
        {item && (
          <>
            <ItemForm
              item={item}
              action={boundAction}
              submitLabel="Save Changes"
              onSuccess={onClose}
            />

            <Separator className="my-2" />

            <div>
              {!confirmDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Item
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-center text-sm text-muted-foreground">
                    Are you sure? This can&apos;t be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      className="flex-1"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Yes, delete"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
