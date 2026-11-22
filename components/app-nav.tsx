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
  const activeIndex = tabs.findIndex((t) => isActive(pathname, t.match));
  return (
    <nav style={{ viewTransitionName: "tabbar" }} className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-40 md:hidden">
      <div className="relative grid grid-cols-4 rounded-[26px] bg-card/95 p-1.5 shadow-[0_10px_30px_-12px_rgb(40_50_110/0.35)] backdrop-blur">
        {/* The soft blue pill slides under whichever tab is open. */}
        <span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 left-1.5 rounded-[20px] bg-[#e7ecff] transition-[translate,opacity] duration-[380ms] ease-[cubic-bezier(0.3,1.3,0.5,1)]"
          style={{
            width: "calc((100% - 12px) / 4)",
            translate: `${Math.max(activeIndex, 0) * 100}% 0`,
            opacity: activeIndex < 0 ? 0 : 1,
          }}
        />
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = isActive(pathname, match);
          return (
            <Link
              key={href}
              href={href}
              transitionTypes={["tab"]}
              aria-current={active ? "page" : undefined}
              className={cn(
                "press relative flex flex-col items-center gap-0.5 rounded-[20px] py-1.5 text-[11px] font-semibold text-muted-foreground",
                active && "text-primary",
              )}
            >
              <Icon className={cn("size-[22px] transition-transform duration-300", active && "-translate-y-px")} strokeWidth={active ? 2.3 : 1.8} />
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
            transitionTypes={["tab"]}
            className={cn(
              "press flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
              active && "bg-[#e7ecff] font-semibold text-primary hover:bg-[#e7ecff] hover:text-primary",
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
