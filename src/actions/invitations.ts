"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";
import crypto from "crypto";

export async function createInviteLink(
  registryId: string
): Promise<ActionResult<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const token = crypto.randomBytes(24).toString("hex");

  const { error } = await supabase.from("invitations").insert({
    registry_id: registryId,
    invited_by: user.id,
    invite_token: token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: token };
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", inviteId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

export async function acceptInvite(token: string): Promise<ActionResult<string>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string; registry_id?: string };

  if (!result.success) {
    return { success: false, error: result.error || "Failed to accept invitation" };
  }

  revalidatePath("/subscriptions");
  return { success: true, data: result.registry_id! };
}
