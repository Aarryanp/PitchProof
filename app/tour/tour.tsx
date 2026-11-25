"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Gauge, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Search for businesses",
    text: "Pick a type of business and a city. The agent finds up to 20 and checks each website with real tools.",
    art: <SearchArt />,
  },
  {
    title: "Only real problems count",
    text: "A business makes it to your leads only if a problem has hard proof, like a speed score or a missing contact button.",
    art: <LeadsArt />,
  },
  {
    title: "You approve every email",
    text: "Each pitch has a short email in your voice and a page made for that business. Edit it, then press Approve. Nothing is sent without you.",
    art: <EmailArt />,
  },
  {
    title: "See what works",
    text: "Results shows who opened your page and who replied, so you can see which pitches land.",
    art: <ResultsArt />,
  },
];

export function Tour() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const go = (j: number) => {
    setDir(j < i ? "back" : "fwd");
    setI(j);
  };
  const last = i === slides.length - 1;
  const s = slides[i];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex h-12 items-center justify-end">
        <Link href="/search" className="press rounded-full bg-card px-4 py-2 text-sm font-semibold text-muted-foreground shadow-card">
          Skip
        </Link>
      </div>

      <div key={i} className={cn("flex flex-1 flex-col", dir === "fwd" ? "pp-step-fwd" : "pp-step-back")}>
        <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-[28px] bg-[#e7ecff] p-6">{s.art}</div>
        <h1 className="mt-8 text-[26px] font-extrabold leading-tight tracking-tight">{s.title}</h1>
        <p className="mt-3 text-muted-foreground">{s.text}</p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex gap-1.5">
          {slides.map((_, j) => (
            <button
              key={j}
              aria-label={`Slide ${j + 1}`}
              onClick={() => go(j)}
              className={cn("h-2 rounded-full bg-[#d5d9ea] transition-all duration-300", j === i ? "w-6 bg-primary" : "w-2")}
            />
          ))}
        </div>
        <Button size="lg" className="px-7" onClick={() => (last ? router.push("/search") : go(i + 1))}>
          {last ? "Start my first search" : "Next"}
          {!last && <ChevronRight />}
        </Button>
      </div>
    </div>
  );
}

// Small drawings of each screen, made with plain boxes (no images to load).
function SearchArt() {
  return (
    <div className="w-full max-w-60 rounded-[22px] bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm">
        <Search className="size-4 text-muted-foreground" /> Clinics in Nagpur
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {["Speed score", "Phone check", "Contact button"].map((t) => (
          <div key={t} className="flex items-center justify-between text-xs text-muted-foreground">
            {t}
            <Gauge className="size-3.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadsArt() {
  return (
    <div className="flex w-full max-w-60 flex-col gap-2">
      {[
        { n: "Dental clinic", p: "9 s to open on a phone", ok: true },
        { n: "Eye hospital", p: "No WhatsApp or phone link", ok: true },
        { n: "Heart institute", p: "Site is fine, skipped", ok: false },
      ].map((c) => (
        <div key={c.n} className={cn("rounded-[18px] bg-card p-3 shadow-card", !c.ok && "opacity-50")}>
          <p className="text-sm font-medium">{c.n}</p>
          <p className="text-xs text-muted-foreground">{c.p}</p>
        </div>
      ))}
    </div>
  );
}

function EmailArt() {
  return (
    <div className="w-full max-w-60 rounded-[22px] bg-card p-4 shadow-card">
      <div className="flex flex-col gap-1.5">
        <div className="h-2 w-1/3 rounded bg-muted-foreground/25" />
        <div className="h-2 w-full rounded bg-muted-foreground/15" />
        <div className="h-2 w-5/6 rounded bg-muted-foreground/15" />
        <div className="h-2 w-2/3 rounded bg-primary/30" />
      </div>
      <div className="mt-4 flex gap-2">
        <span className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-1.5 text-xs font-medium text-primary-foreground">
          <Check className="size-3.5" /> Approve
        </span>
        <span className="flex items-center justify-center rounded-full bg-muted px-2.5 py-1.5 text-xs">
          <X className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

function ResultsArt() {
  return (
    <div className="flex w-full max-w-60 items-end justify-center gap-3 rounded-[22px] bg-card p-4 shadow-card">
      {[
        { h: "h-24", l: "Sent", c: "bg-muted-foreground/25" },
        { h: "h-14", l: "Opened", c: "bg-status-waiting/70" },
        { h: "h-8", l: "Replied", c: "bg-status-replied/80" },
      ].map((b) => (
        <div key={b.l} className="flex flex-1 flex-col items-center gap-1.5">
          <div className={cn("w-full rounded-md", b.h, b.c)} />
          <span className="text-[10px] text-muted-foreground">{b.l}</span>
        </div>
      ))}
    </div>
  );
}
