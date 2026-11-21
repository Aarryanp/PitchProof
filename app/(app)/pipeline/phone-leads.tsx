"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { LeadCard, Stage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Phone view of the pipeline: one stage at a time, picked from a row of
// chips, instead of seven columns that don't fit a phone screen.
export function PhoneLeads({ leads, columns }: { leads: LeadCard[]; columns: { stage: Stage; title: string }[] }) {
  const first = leads.some((l) => l.stage === "needs_approval") ? "needs_approval" : columns[0].stage;
  const [stage, setStage] = useState<Stage>(first);
  const shown = leads.filter((l) => l.stage === stage);

  return (
    <div>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {columns.map((c) => {
          const n = leads.filter((l) => l.stage === c.stage).length;
          const active = c.stage === stage;
          return (
            <button
              key={c.stage}
              onClick={() => setStage(c.stage)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-3.5 py-1.5 text-sm",
                active && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {c.title}
              <span className={cn("text-xs", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{n}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2.5">
        {shown.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
        {shown.map((card) => {
          const body = (
            <>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{card.companyName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{[card.sector, card.city].filter(Boolean).join(" · ")}</p>
                {card.topProblem && <p className="mt-2 text-sm">{card.topProblem}</p>}
                {card.skipReason && (
                  <Badge variant="skipped" className="mt-2 whitespace-normal">
                    {card.skipReason}
                  </Badge>
                )}
              </div>
              {card.pitchId && <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
            </>
          );
          const cls = "flex items-center gap-3 rounded-xl border bg-background p-4 shadow-xs";
          return card.pitchId ? (
            <Link key={card.key} href={`/pitch/${card.pitchId}`} className={cn(cls, "active:bg-accent")}>
              {body}
            </Link>
          ) : (
            <div key={card.key} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
