"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribe } from "@/actions/subscriptions";

export function SubscribeButton({ registryId }: { registryId: string }) {
  const [pending, setPending] = useState(false);
  const [followed, setFollowed] = useState(false);
  const router = useRouter();

  async function handleSubscribe() {
    setPending(true);
    const result = await subscribe(registryId);
    setPending(false);

    if (result.success) {
      setFollowed(true);
      setTimeout(() => router.refresh(), 1500);
    }
  }

  if (followed) {
    return (
      <Button disabled className="gap-2 bg-green-600 text-white hover:bg-green-600">
        <Check className="h-4 w-4" />
        Following
      </Button>
    );
  }

  return (
    <Button onClick={handleSubscribe} disabled={pending} className="gap-2">
      <UserPlus className="h-4 w-4" />
      {pending ? "Following..." : "Follow this registry"}
    </Button>
  );
}
