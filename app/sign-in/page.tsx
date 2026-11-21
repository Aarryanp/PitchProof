import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Pitchproof" };

// Screen 1: Sign in. Google (main way) or an email link, both through Supabase Auth.
export default function SignInPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-background px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:items-center sm:justify-center sm:bg-muted/40">
      <div className="w-full max-w-sm sm:rounded-2xl sm:border sm:bg-background sm:p-8">
        <Link href="/welcome" aria-label="Back" className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent sm:hidden">
          <ArrowLeft className="size-5" />
        </Link>
        <LogoMark className="mt-8 size-12 sm:mt-0" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-muted-foreground">Use your Google account, or get a link by email. No password needed.</p>
        <Suspense>
          <SignInForm />
        </Suspense>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Just looking?{" "}
          <Link href="/pipeline" className="text-primary hover:underline">
            See the app with sample data
          </Link>
        </p>
      </div>
    </main>
  );
}
