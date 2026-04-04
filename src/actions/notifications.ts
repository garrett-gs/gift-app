"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  return { success: true, data: undefined };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  return { success: true, data: undefined };
}
