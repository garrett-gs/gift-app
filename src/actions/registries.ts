"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registrySchema } from "@/lib/validators/registry";
import type { ActionResult } from "@/lib/types";

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export async function createRegistry(formData: FormData): Promise<ActionResult<string>> {
  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    occasion: formData.get("occasion") || undefined,
    occasionDate: formData.get("occasionDate") || undefined,
    isPublic: formData.get("isPublic"),
  };

  const parsed = registrySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const slug = generateSlug(parsed.data.title);

  const { data, error } = await supabase.from("registries").insert({
    owner_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    occasion: parsed.data.occasion || null,
    occasion_date: parsed.data.occasionDate || null,
    is_public: parsed.data.isPublic || false,
    slug,
  }).select().single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Failed to create registry. Please try again." };
  }

  revalidatePath("/registries");
  revalidatePath("/dashboard");
  redirect(`/registries/${slug}`);
}

export async function updateRegistry(
  registryId: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    occasion: formData.get("occasion") || undefined,
    occasionDate: formData.get("occasionDate") || undefined,
    isPublic: formData.get("isPublic"),
  };

  const parsed = registrySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("registries")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      occasion: parsed.data.occasion || null,
      occasion_date: parsed.data.occasionDate || null,
      is_public: parsed.data.isPublic || false,
    })
    .eq("id", registryId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/registries");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function deleteRegistry(registryId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("registries")
    .delete()
    .eq("id", registryId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/registries");
  revalidatePath("/dashboard");
  redirect("/registries");
}
