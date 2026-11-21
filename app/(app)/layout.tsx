import Link from "next/link";
import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { createClient } from "@/lib/supabase/server";

// Shared frame for the student screens (2–6): name on the left, menu, and
// who is signed in on the right.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/pipeline" className="font-semibold tracking-tight">
              Pitchproof
            </Link>
            <div className="sm:hidden">
              <Suspense>
                <Account />
              </Suspense>
            </div>
          </div>
          <Suspense fallback={<div className="h-8" />}>
            <AppNav />
          </Suspense>
          <div className="ml-auto hidden sm:block">
            <Suspense>
              <Account />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

async function Account() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return (
      <Link href="/sign-in" className="text-sm font-medium text-primary hover:underline">
        Sign in
      </Link>
    );
  }
  return (
    <form action="/auth/sign-out" method="post" className="flex items-center gap-3 text-sm">
      <span className="hidden max-w-48 truncate text-muted-foreground md:inline">{data.user.email}</span>
      <button className="text-muted-foreground hover:text-foreground">Sign out</button>
    </form>
  );
}
