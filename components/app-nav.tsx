"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, KanbanSquare, Search, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/search", label: "New search", icon: Search },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href === "/pipeline" && pathname.startsWith("/pitch/"));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              active && "bg-accent font-medium text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
