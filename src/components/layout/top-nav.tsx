"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Home, List, Heart, User } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

const bottomTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/registries", label: "Registries", icon: List },
  { href: "/subscriptions", label: "My People", icon: Heart },
  { href: "/settings", label: "Profile", icon: User },
];

export function TopNav({ displayName }: { displayName: string }) {
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

          <UserMenu displayName={displayName} />
        </div>
      </header>

      {/* Bottom tab bar — mobile only */}
      <nav className="fixed left-0 right-0 z-50 border-t bg-background md:hidden" style={{ bottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {bottomTabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-5 py-2 text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-6 w-6" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
