"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { acceptInvite } from "@/actions/invitations";
import { Gift } from "lucide-react";

interface AcceptInviteProps {
  token: string;
  registryTitle: string;
  ownerName: string;
}

export function AcceptInvite({ token, registryTitle, ownerName }: AcceptInviteProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAccept() {
    setPending(true);
    setError(null);
    const result = await acceptInvite(token);
    setPending(false);

    if (result.success) {
      router.push("/subscriptions");
    } else {
      setError(result.error);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
          <Gift className="h-8 w-8" />
        </div>
        <CardTitle>You&apos;re invited!</CardTitle>
        <CardDescription>
          <strong>{ownerName}</strong> wants to share their registry
          &ldquo;{registryTitle}&rdquo; with you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          When you accept, you&apos;ll be able to see their wish list and mark
          items as purchased.
        </p>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <Button
          className="w-full"
          onClick={handleAccept}
          disabled={pending}
        >
          {pending ? "Accepting..." : "Accept invitation"}
        </Button>
      </CardContent>
    </Card>
  );
}
