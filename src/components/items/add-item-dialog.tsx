"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemForm } from "@/components/items/item-form";
import { addItem } from "@/actions/items";

export function AddItemDialog({ registryId }: { registryId: string }) {
  const [open, setOpen] = useState(false);

  const boundAction = async (formData: FormData) => {
    return await addItem(registryId, formData);
  };

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Item
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add an item</DialogTitle>
          </DialogHeader>
          <ItemForm
            action={boundAction}
            submitLabel="Add Item"
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
