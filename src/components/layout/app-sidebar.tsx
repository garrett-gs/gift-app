"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Home, List, Heart, User, ContactRound } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/registries", label: "My Registries", icon: List },
  { href: "/subscriptions", label: "My People", icon: Heart },
  { href: "/find-friends", label: "Find Friends", icon: ContactRound },
  { href: "/settings", label: "My Profile", icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Gift className="h-5 w-5" />
        <span className="text-lg font-bold">GIFT</span>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
