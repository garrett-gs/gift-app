import type { Database } from "./database";

// Convenience type aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Registry = Database["public"]["Tables"]["registries"]["Row"];
export type RegistryItem = Database["public"]["Tables"]["registry_items"]["Row"];
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// Server Action return type
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
