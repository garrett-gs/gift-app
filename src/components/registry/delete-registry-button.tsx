"use client";

import { useState } from "react";
import { deleteRegistry } from "@/actions/registries";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteRegistryButton({ registryId }: { registryId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    await deleteRegistry(registryId);
    setPending(false);
  }

  if (!confirming) {
    return (
      <Button
        variant="destructive"
        onClick={() => setConfirming(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete Registry
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Are you sure?</span>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={pending}
      >
        {pending ? "Deleting..." : "Yes, delete it"}
      </Button>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
