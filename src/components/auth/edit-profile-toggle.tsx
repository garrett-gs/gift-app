"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export function EditProfileToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-semibold">Edit Profile</span>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t px-5 pb-5 pt-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
