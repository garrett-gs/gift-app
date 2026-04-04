import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ShareRegistry } from "@/components/invitations/share-registry";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share Registry",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ShareRegistryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: registry } = await supabase
    .from("registries")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!registry) {
    notFound();
  }

  if (registry.owner_id !== user?.id) {
    redirect("/registries");
  }

  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .eq("registry_id", registry.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/registries/${slug}`}
        className={cn(buttonVariants({ variant: "ghost" }), "mb-4 gap-2")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {registry.title}
      </Link>

      <h1 className="text-2xl font-bold">Share Registry</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite people to view &ldquo;{registry.title}&rdquo; and shop for you
      </p>

      <div className="mt-8">
        <ShareRegistry
          registryId={registry.id}
          registrySlug={slug}
          existingInvites={invitations || []}
        />
      </div>
    </div>
  );
}
