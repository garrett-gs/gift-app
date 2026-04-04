import { createRegistry } from "@/actions/registries";
import { RegistryForm } from "@/components/registry/registry-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Registry",
};

export default function NewRegistryPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Create a Registry</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set up a new gift registry for any occasion
      </p>
      <div className="mt-8">
        <RegistryForm action={createRegistry} submitLabel="Create Registry" />
      </div>
    </div>
  );
}
