import Link from "next/link";
import { Suspense } from "react";
import { Splash } from "@/components/splash";
import { LogOut } from "lucide-react";
import { BottomTabs, SideNav } from "@/components/app-nav";
import { Logo, LogoMark } from "@/components/logo";
import { getSessionUser } from "@/lib/auth";

// Shared frame for the student screens. Phones: a small top bar and a tab bar
// at the bottom. Computers: a menu down the left side.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 bg-background">
      <Splash />
      <aside style={{ viewTransitionName: "sidenav" }} className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-card px-3 py-5 shadow-[1px_0_0_#e3e6f0] md:flex">
        <Link href="/pipeline" className="mb-6 px-2">
          <Logo />
        </Link>
        <Suspense fallback={<div className="h-48" />}>
          <SideNav />
        </Suspense>
        <div className="mt-auto px-1">
          <Suspense>
            <Account variant="side" />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header style={{ viewTransitionName: "topbar" }} className="sticky top-0 z-30 flex items-center justify-between bg-background/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden">
          <Link href="/pipeline" className="flex h-12 items-center gap-2 font-semibold tracking-tight">
            <LogoMark className="size-6" /> Pitchproof
          </Link>
          <Suspense>
            <Account variant="top" />
          </Suspense>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-32 md:px-8 md:pt-8 md:pb-12">{children}</main>
      </div>

      <Suspense>
        <BottomTabs />
      </Suspense>
    </div>
  );
}

async function Account({ variant }: { variant: "side" | "top" }) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Link
        href="/sign-in"
        className={variant === "side" ? "press block rounded-full bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground" : "press rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"}
      >
        Sign in
      </Link>
    );
  }
  const email = user.email ?? "";
  if (variant === "top") {
    return (
      <Link href="/profile" aria-label="Your profile" className="press flex size-9 items-center justify-center rounded-full bg-[#e7ecff] text-sm font-bold text-primary">
        {email.charAt(0).toUpperCase()}
      </Link>
    );
  }
  return (
    <form action="/auth/sign-out" method="post" className="flex items-center gap-2 rounded-full px-2 py-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e7ecff] text-sm font-bold text-primary">
        {email.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{email}</span>
      <button aria-label="Sign out" className="press rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
        <LogOut className="size-4" />
      </button>
    </form>
  );
}
