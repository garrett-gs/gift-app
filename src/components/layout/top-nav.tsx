"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/registries", label: "Registries" },
  { href: "/subscriptions", label: "My People" },
  { href: "/find-friends", label: "Find Friends" },
  { href: "/notifications", label: "Notifications" },
];

export function TopNav({ displayName, unreadNotifications }: { displayName: string; unreadNotifications: number }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile logo */}
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <Gift className="h-5 w-5" />
          <span className="font-bold">GIFT</span>
        </Link>

        {/* Spacer for desktop (sidebar has the logo) */}
        <div className="hidden md:block" />

        <div className="flex items-center gap-2">
          <NotificationBell unreadCount={unreadNotifications} />
          <UserMenu displayName={displayName} />
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t px-4 py-3 md:hidden">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
