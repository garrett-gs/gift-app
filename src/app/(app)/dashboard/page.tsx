import Link from "next/link";
import { Plus, List } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RegistryCard } from "@/components/registry/registry-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: registries } = await supabase
    .from("registries")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here&apos;s an overview of your registries.
          </p>
        </div>
        <Link
          href="/registries/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="h-4 w-4" />
          New Registry
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">My Registries</h2>
        <div className="mt-4">
          {registries && registries.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {registries.map((registry) => (
                  <RegistryCard key={registry.id} registry={registry} />
                ))}
              </div>
              {registries.length >= 6 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/registries"
                    className="text-sm text-primary hover:underline"
                  >
                    View all registries
                  </Link>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<List className="h-12 w-12" />}
              title="No registries yet"
              description="Create your first gift registry to get started."
              action={
                <Link
                  href="/registries/new"
                  className={cn(buttonVariants(), "gap-2")}
                >
                  <Plus className="h-4 w-4" />
                  Create Registry
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
