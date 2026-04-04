import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AcceptInvite } from "@/components/invitations/accept-invite";
import { Gift } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept Invitation",
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Look up the invitation
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("invite_token", token)
    .single();

  if (!invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center">
          <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Invalid invitation</h1>
          <p className="mt-2 text-muted-foreground">
            This invitation link is invalid or has expired.
          </p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center">
          <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Invitation expired</h1>
          <p className="mt-2 text-muted-foreground">
            This invitation has expired. Ask the registry owner for a new link.
          </p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  // Check if already accepted
  if (invitation.accepted_at) {
    if (user) {
      redirect("/subscriptions");
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center">
          <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Already accepted</h1>
          <p className="mt-2 text-muted-foreground">
            This invitation has already been used.
          </p>
          <Link href="/login" className="mt-4 inline-block text-primary hover:underline">
            Log in to view your subscriptions
          </Link>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to signup with a return URL
  if (!user) {
    redirect(`/signup?next=/invite/${token}`);
  }

  // Get registry and owner info
  const { data: registry } = await supabase
    .from("registries")
    .select("title, owner_id")
    .eq("id", invitation.registry_id)
    .single();

  const { data: owner } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", registry?.owner_id || "")
    .single();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <AcceptInvite
        token={token}
        registryTitle={registry?.title || "Gift Registry"}
        ownerName={owner?.display_name || "Someone"}
      />
    </div>
  );
}
