"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "@/actions/notifications";

export function MarkAllReadButton() {
  const [pending, setPending] = useState(false);

  async function handleMarkAll() {
    setPending(true);
    await markAllNotificationsRead();
    setPending(false);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleMarkAll}
      disabled={pending}
    >
      <Check className="h-4 w-4" />
      {pending ? "Marking..." : "Mark all read"}
    </Button>
  );
}
