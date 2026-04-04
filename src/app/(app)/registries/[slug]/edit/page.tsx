import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateRegistry, deleteRegistry } from "@/actions/registries";
import { RegistryForm } from "@/components/registry/registry-form";
import { DeleteRegistryButton } from "@/components/registry/delete-registry-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Registry",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditRegistryPage({ params }: Props) {
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

  const updateAction = updateRegistry.bind(null, registry.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Edit Registry</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your registry details
      </p>
      <div className="mt-8">
        <RegistryForm
          registry={registry}
          action={updateAction}
          submitLabel="Save Changes"
        />
      </div>
      <div className="mt-12 border-t pt-8">
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting a registry removes all its items and cannot be undone.
        </p>
        <div className="mt-4">
          <DeleteRegistryButton registryId={registry.id} />
        </div>
      </div>
    </div>
  );
}
