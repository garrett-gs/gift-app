"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

export async function markPurchased(
  itemId: string,
  registrySlug: string,
  quantity: number = 1
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase.from("purchases").insert({
    item_id: itemId,
    purchaser_id: user.id,
    quantity,
    is_purchased: true,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "You've already marked this item" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/registries/${registrySlug}`);
  return { success: true, data: undefined };
}

export async function markPlanningToBuy(
  itemId: string,
  registrySlug: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase.from("purchases").insert({
    item_id: itemId,
    purchaser_id: user.id,
    quantity: 1,
    is_purchased: false,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "You've already marked this item" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/registries/${registrySlug}`);
  return { success: true, data: undefined };
}

export async function unmarkPurchased(
  purchaseId: string,
  registrySlug: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("purchases")
    .delete()
    .eq("id", purchaseId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/registries/${registrySlug}`);
  return { success: true, data: undefined };
}
