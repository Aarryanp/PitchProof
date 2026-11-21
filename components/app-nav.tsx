"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, KanbanSquare, Search, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

// The app's main menu. On phones it is a tab bar fixed to the bottom of the
// screen (like a native app); on computers it is a menu down the left side.
const tabs = [
  { href: "/pipeline", label: "Leads", icon: KanbanSquare, match: ["/pipeline", "/pitch"] },
  { href: "/search", label: "Search", icon: Search, match: ["/search"] },
  { href: "/results", label: "Results", icon: BarChart3, match: ["/results"] },
  { href: "/profile", label: "Me", icon: User, match: ["/profile", "/settings"] },
];

function isActive(pathname: string, match: string[]) {
  return match.some((m) => pathname === m || pathname.startsWith(m + "/"));
}

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = isActive(pathname, match);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium text-muted-foreground",
                active && "text-primary",
              )}
            >
              <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/10")}>
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const sideItems = [
  { href: "/pipeline", label: "Leads", icon: KanbanSquare, match: ["/pipeline", "/pitch"] },
  { href: "/search", label: "New search", icon: Search, match: ["/search"] },
  { href: "/results", label: "Results", icon: BarChart3, match: ["/results"] },
  { href: "/profile", label: "Profile", icon: User, match: ["/profile"] },
  { href: "/settings", label: "Settings", icon: Settings, match: ["/settings"] },
];

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {sideItems.map(({ href, label, icon: Icon, match }) => {
        const active = isActive(pathname, match);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              active && "bg-primary/10 font-medium text-primary hover:bg-primary/10 hover:text-primary",
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
