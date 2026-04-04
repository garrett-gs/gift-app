import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/auth/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account and profile
      </p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4">
          {profile && <ProfileForm profile={profile} />}
        </div>
      </div>
    </div>
  );
}
