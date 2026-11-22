import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Gauge, Send } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Welcome · Pitchproof" };

// First screen for someone who isn't signed in: the logo draws itself, then
// the three ideas of the app appear one by one, then the buttons.
const points = [
  { icon: Gauge, title: "Find businesses that need you", text: "Real website checks show who has a slow, broken or outdated site." },
  { icon: BadgeCheck, title: "Prove it with real numbers", text: "Only problems with hard evidence make it into a pitch." },
  { icon: Send, title: "Pitch in your own words", text: "Short emails in your voice. Nothing is sent until you approve it." },
];

export default function WelcomePage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-background px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="pp-pop size-16 drop-shadow-[0_12px_20px_rgb(59_91_219/0.35)]">
            <rect width="32" height="32" rx="9" className="fill-primary" />
            <path
              d="M9.5 16.5l4.5 4.5 8.5-9.5"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pp-draw"
              style={{ animationDelay: "0.3s" }}
            />
          </svg>
          <h1 className="pp-rise mt-6 text-4xl font-extrabold tracking-tight" style={{ animationDelay: "0.4s" }}>
            Pitchproof
          </h1>
          <p className="pp-rise mt-2 text-lg text-muted-foreground" style={{ animationDelay: "0.5s" }}>
            Turn your skills into clients, internships and jobs.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {points.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="pp-rise flex gap-4 rounded-[22px] bg-card p-4 shadow-card" style={{ animationDelay: `${0.7 + i * 0.12}s` }}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e7ecff] text-primary">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pp-rise mt-10 flex flex-col gap-3" style={{ animationDelay: "1.15s" }}>
          <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            Get started
          </Link>
          <Link href="/pipeline" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full text-muted-foreground")}>
            Look around with sample data
          </Link>
        </div>
      </div>
    </main>
  );
}
