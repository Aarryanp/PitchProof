import type { Metadata } from "next";
import { Tour } from "./tour";

export const metadata: Metadata = { title: "How it works · Pitchproof" };

// A short tour of the main screens, shown once after onboarding and
// available again from the Profile screen.
export default function TourPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-background">
      <Tour />
    </main>
  );
}
