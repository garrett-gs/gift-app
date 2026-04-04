"use client";

import { useState } from "react";
import { markNotificationRead } from "@/actions/notifications";
import type { Notification } from "@/lib/types";

export function NotificationItem({ notification }: { notification: Notification }) {
  const [isRead, setIsRead] = useState(notification.is_read);

  async function handleMarkRead() {
    if (isRead) return;
    setIsRead(true);
    await markNotificationRead(notification.id);
  }

  const timeAgo = getTimeAgo(new Date(notification.created_at));

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        !isRead ? "border-primary/20 bg-primary/5" : ""
      }`}
      onClick={handleMarkRead}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className={`text-sm ${!isRead ? "font-semibold" : ""}`}>
            {notification.title}
          </p>
          {notification.body && (
            <p className="mt-1 text-sm text-muted-foreground">
              {notification.body}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {timeAgo}
          </span>
          {!isRead && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
