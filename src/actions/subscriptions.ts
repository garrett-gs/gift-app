"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

export async function subscribe(registryId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ registry_id: registryId, subscriber_id: user.id })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Failed to subscribe" };
  }

  revalidatePath("/subscriptions");
  return { success: true, data: undefined };
}

export async function unsubscribe(registryId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("registry_id", registryId)
    .eq("subscriber_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
