"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { itemSchema } from "@/lib/validators/item";
import type { ActionResult } from "@/lib/types";

export async function addItem(
  registryId: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price") || undefined,
    currency: formData.get("currency") || "USD",
    url: formData.get("url") || undefined,
    priority: formData.get("priority") || 3,
    notes: formData.get("notes") || undefined,
    quantityDesired: formData.get("quantityDesired") || 1,
  };

  const imageUrl = formData.get("imageUrl") as string || null;
  const category = formData.get("category") as string || "general";
  const size = formData.get("size") as string || null;

  // Append size info to notes if provided
  let notes = raw.notes as string || "";
  if (size) {
    notes = notes ? `Size: ${size} | ${notes}` : `Size: ${size}`;
  }
  if (category && category !== "general") {
    notes = notes ? `${notes} | Category: ${category}` : `Category: ${category}`;
  }

  const parsed = itemSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: registry } = await supabase
    .from("registries")
    .select("id, slug")
    .eq("id", registryId)
    .single();

  if (!registry) {
    return { success: false, error: "Registry not found" };
  }

  const { data, error } = await supabase.from("registry_items").insert({
    registry_id: registryId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price: parsed.data.price ?? null,
    currency: parsed.data.currency,
    url: parsed.data.url || null,
    image_url: imageUrl,
    priority: parsed.data.priority,
    notes: notes || null,
    quantity_desired: parsed.data.quantityDesired,
  }).select().single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Failed to add item. Please try again." };
  }

  revalidatePath(`/registries/${registry.slug}`);
  return { success: true, data: undefined };
}

export async function updateItem(
  itemId: string,
  registrySlug: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price") || undefined,
    currency: formData.get("currency") || "USD",
    url: formData.get("url") || undefined,
    priority: formData.get("priority") || 3,
    notes: formData.get("notes") || undefined,
    quantityDesired: formData.get("quantityDesired") || 1,
  };

  const imageUrl = formData.get("imageUrl") as string || null;
  const category = formData.get("category") as string || "general";
  const size = formData.get("size") as string || null;

  let notes = raw.notes as string || "";
  if (size) {
    notes = notes ? `Size: ${size} | ${notes}` : `Size: ${size}`;
  }
  if (category && category !== "general") {
    notes = notes ? `${notes} | Category: ${category}` : `Category: ${category}`;
  }

  const parsed = itemSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("registry_items")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price ?? null,
      currency: parsed.data.currency,
      url: parsed.data.url || null,
      image_url: imageUrl,
      priority: parsed.data.priority,
      notes: notes || null,
      quantity_desired: parsed.data.quantityDesired,
    })
    .eq("id", itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/registries/${registrySlug}`);
  return { success: true, data: undefined };
}

export async function deleteItem(
  itemId: string,
  registrySlug: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("registry_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/registries/${registrySlug}`);
  return { success: true, data: undefined };
}
