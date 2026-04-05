"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribe } from "@/actions/subscriptions";

export function SubscribeButton({ registryId }: { registryId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubscribe() {
    setPending(true);
    const result = await subscribe(registryId);
    setPending(false);

    if (result.success) {
      router.refresh();
    }
  }

  return (
    <Button onClick={handleSubscribe} disabled={pending} className="gap-2">
      <UserPlus className="h-4 w-4" />
      {pending ? "Following..." : "Follow this registry"}
    </Button>
  );
}
