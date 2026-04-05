import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/parse-vcf";

export async function POST(request: Request) {
  try {
    const { contacts } = await request.json();

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: "Contacts array required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Collect all unique emails and phones
    const emailSet = new Set<string>();
    const phoneSet = new Set<string>();

    for (const c of contacts) {
      if (c.emails) {
        for (const e of c.emails) {
          const normalized = e.toLowerCase().trim();
          if (normalized.includes("@")) emailSet.add(normalized);
        }
      }
      if (c.phones) {
        for (const p of c.phones) {
          const normalized = normalizePhone(p);
          if (normalized) phoneSet.add(normalized);
        }
      }
    }

    // Delete existing contacts for this user and re-insert
    await supabase.from("user_contacts").delete().eq("user_id", user.id);

    // Build contact rows
    const contactRows: {
      user_id: string;
      contact_email: string | null;
      contact_phone: string | null;
    }[] = [];

    for (const email of emailSet) {
      contactRows.push({ user_id: user.id, contact_email: email, contact_phone: null });
    }
    for (const phone of phoneSet) {
      // Only add if we didn't already add this phone via an email row
      contactRows.push({ user_id: user.id, contact_email: null, contact_phone: phone });
    }

    // Insert in batches of 100
    for (let i = 0; i < contactRows.length; i += 100) {
      const batch = contactRows.slice(i, i + 100);
      await supabase.from("user_contacts").insert(batch);
    }

    // Now match against existing profiles
    const allEmails = Array.from(emailSet);
    const allPhones = Array.from(phoneSet);

    // Find matching profiles by email
    let matchedProfiles: { id: string; display_name: string; avatar_url: string | null; email: string; phone: string | null }[] = [];

    if (allEmails.length > 0) {
      const { data: emailMatches } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email, phone")
        .in("email", allEmails)
        .neq("id", user.id);
      if (emailMatches) matchedProfiles.push(...emailMatches);
    }

    // Find matching profiles by phone
    if (allPhones.length > 0) {
      const { data: phoneMatches } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email, phone")
        .in("phone", allPhones)
        .neq("id", user.id);
      if (phoneMatches) {
        // Deduplicate
        const existingIds = new Set(matchedProfiles.map((p) => p.id));
        for (const pm of phoneMatches) {
          if (!existingIds.has(pm.id)) matchedProfiles.push(pm);
        }
      }
    }

    // Update matched contacts
    for (const profile of matchedProfiles) {
      await supabase
        .from("user_contacts")
        .update({ matched_user_id: profile.id, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .or(`contact_email.eq.${profile.email}${profile.phone ? `,contact_phone.eq.${profile.phone}` : ""}`);
    }

    // Get public registries for matched users
    const results = [];
    for (const profile of matchedProfiles) {
      const { data: registries } = await supabase
        .from("registries")
        .select("id, title, slug")
        .eq("owner_id", profile.id)
        .eq("is_public", true)
        .limit(5);

      const { data: existingSubs } = await supabase
        .from("subscriptions")
        .select("registry_id")
        .eq("subscriber_id", user.id)
        .in("registry_id", (registries || []).map((r) => r.id));

      const subscribedIds = new Set((existingSubs || []).map((s) => s.registry_id));

      results.push({
        id: profile.id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        registries: (registries || []).map((r) => ({
          ...r,
          isSubscribed: subscribedIds.has(r.id),
        })),
      });
    }

    return NextResponse.json({
      synced: contactRows.length,
      friends: results,
    });
  } catch {
    return NextResponse.json({ error: "Failed to sync contacts" }, { status: 500 });
  }
}
