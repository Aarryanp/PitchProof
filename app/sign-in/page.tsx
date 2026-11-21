import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Pitchproof" };

// Screen 1: Sign in. Google (main way) or an email link, both through Supabase Auth.
export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-lg font-semibold tracking-tight">Pitchproof</p>
        <div className="rounded-lg border bg-background p-6">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your Google account, or get a link by email. No password needed.
          </p>
          <Suspense>
            <SignInForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Just looking?{" "}
          <Link href="/pipeline" className="text-primary hover:underline">
            See the app with sample data
          </Link>
        </p>
      </div>
    </main>
  );
}
