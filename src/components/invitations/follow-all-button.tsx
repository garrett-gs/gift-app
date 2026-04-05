"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribe } from "@/actions/subscriptions";

interface FollowAllButtonProps {
  registryIds: string[];
  alreadyFollowingAll: boolean;
}

export function FollowAllButton({ registryIds, alreadyFollowingAll }: FollowAllButtonProps) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(alreadyFollowingAll);
  const router = useRouter();

  async function handleFollow() {
    setPending(true);
    for (const id of registryIds) {
      await subscribe(id);
    }
    setDone(true);
    setPending(false);
    router.refresh();
  }

  if (done) {
    return (
      <Button disabled className="gap-2 bg-green-600 text-white hover:bg-green-600">
        <Check className="h-4 w-4" />
        Following
      </Button>
    );
  }

  return (
    <Button onClick={handleFollow} disabled={pending} className="gap-2">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {pending ? "Following..." : "Follow"}
    </Button>
  );
}
