import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Emails array is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Normalize emails
    const normalizedEmails = emails
      .map((e: string) => e.toLowerCase().trim())
      .filter((e: string) => e && e.includes("@"))
      .slice(0, 500); // Limit to 500 contacts

    if (normalizedEmails.length === 0) {
      return NextResponse.json({ friends: [] });
    }

    // Find matching profiles (exclude self)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, email")
      .in("email", normalizedEmails)
      .neq("id", user.id);

    // For each found user, check if we already subscribe to any of their registries
    const foundUsers = [];
    for (const profile of profiles || []) {
      const { data: registries } = await supabase
        .from("registries")
        .select("id, title, slug, is_public")
        .eq("owner_id", profile.id)
        .eq("is_public", true)
        .limit(5);

      // Check existing subscriptions
      const { data: existingSubs } = await supabase
        .from("subscriptions")
        .select("registry_id")
        .eq("subscriber_id", user.id)
        .in(
          "registry_id",
          (registries || []).map((r) => r.id)
        );

      const subscribedIds = new Set(
        (existingSubs || []).map((s) => s.registry_id)
      );

      foundUsers.push({
        id: profile.id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        registries: (registries || []).map((r) => ({
          ...r,
          isSubscribed: subscribedIds.has(r.id),
        })),
      });
    }

    return NextResponse.json({ friends: foundUsers });
  } catch {
    return NextResponse.json(
      { error: "Failed to search contacts" },
      { status: 500 }
    );
  }
}
