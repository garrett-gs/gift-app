"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Home, List, Heart, Bell, User } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";

const bottomTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/registries", label: "Registries", icon: List },
  { href: "/subscriptions", label: "My People", icon: Heart },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Profile", icon: User },
];

export function TopNav({ displayName, unreadNotifications }: { displayName: string; unreadNotifications: number }) {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <span className="font-bold text-lg">GIFT</span>
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell unreadCount={unreadNotifications} />
            <UserMenu displayName={displayName} />
          </div>
        </div>
      </header>

      {/* Bottom tab bar — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {bottomTabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            const isNotifications = tab.href === "/notifications";

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                {isNotifications && unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
