import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/auth/profile-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
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
      <h1 className="text-2xl font-bold">My Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell people about yourself so they know what to get you
      </p>

      <div className="mt-8">
        {profile && <ProfileEditor profile={profile} />}
      </div>
    </div>
  );
}
