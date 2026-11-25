import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getProfile } from "@/lib/data";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = { title: "Set up · Pitchproof" };

// Onboarding: a few questions, one per screen, right after the first sign-in.
// The answers fill the student's Profile (same table, same save action).
export default function OnboardingPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-background">
      <Suspense>
        <Loader />
      </Suspense>
    </main>
  );
}

async function Loader() {
  const { viewer, student, portfolio } = await getProfile();
  if (!viewer) redirect("/sign-in");
  return <OnboardingFlow student={student} portfolio={portfolio} />;
}
