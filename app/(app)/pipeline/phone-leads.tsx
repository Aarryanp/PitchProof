"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { LeadCard, Stage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
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
                "press flex shrink-0 items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-card",
                active && "bg-[#1b1d2a] text-white",
              )}
            >
              {c.title}
              <span className={cn("text-xs", active ? "text-white/70" : "text-muted-foreground")}>{n}</span>
            </button>
          );
        })}
      </div>
      {/* key={stage}: switching chips replays the cards settling in. */}
      <div key={stage} className="flex flex-col gap-3">
        {shown.length === 0 && <p className="settle py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
        {shown.map((card, i) => {
          const body = (
            <>
              <Avatar name={card.companyName} className="self-start" />
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-snug">{card.companyName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{[card.sector, card.city].filter(Boolean).join(" · ")}</p>
                {card.topProblem && <p className="mt-2 inline-block rounded-xl bg-[#fff1dc] px-2.5 py-1 text-xs font-semibold text-[#a35a00]">{card.topProblem}</p>}
                {card.skipReason && (
                  <Badge variant="skipped" className="mt-2 whitespace-normal">
                    {card.skipReason}
                  </Badge>
                )}
              </div>
              {card.pitchId && <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
            </>
          );
          const cls = "settle flex items-center gap-3 rounded-[22px] bg-card p-4 shadow-card";
          const style = { "--i": i } as React.CSSProperties;
          return card.pitchId ? (
            <Link key={card.key} href={`/pitch/${card.pitchId}`} transitionTypes={["nav-forward"]} style={style} className={cn(cls, "press press-soft")}>
              {body}
            </Link>
          ) : (
            <div key={card.key} style={style} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
