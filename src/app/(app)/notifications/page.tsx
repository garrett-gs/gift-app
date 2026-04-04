import { Bell, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <div className="mt-8">
        {notifications && notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Bell className="h-12 w-12" />}
            title="No notifications"
            description="When someone interacts with your registries, you'll see updates here."
          />
        )}
      </div>
    </div>
  );
}
