import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { getLeads } from "@/lib/data";
import type { LeadCard, Stage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { SampleNote } from "@/components/sample-note";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline · Pitchproof" };

// Screen 4: Pipeline board. One column per stage, from found to replied,
// plus Skipped with the reason.
const columns: { stage: Stage; title: string; dot: string }[] = [
  { stage: "found", title: "Found", dot: "bg-muted-foreground/40" },
  { stage: "audited", title: "Audited", dot: "bg-muted-foreground/70" },
  { stage: "needs_approval", title: "Needs approval", dot: "bg-primary" },
  { stage: "sent", title: "Sent", dot: "bg-status-waiting" },
  { stage: "opened", title: "Page opened", dot: "bg-status-waiting" },
  { stage: "replied", title: "Replied", dot: "bg-status-replied" },
  { stage: "skipped", title: "Skipped", dot: "bg-status-skipped" },
];

export default function PipelinePage() {
  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Every business the agent found, and where each pitch stands."
        actions={
          <Link href="/search" className={buttonVariants()}>
            <Plus /> New search
          </Link>
        }
      />
      <Suspense fallback={<Loading />}>
        <Board />
      </Suspense>
    </>
  );
}

async function Board() {
  const { leads, sample, signedIn } = await getLeads();
  const waiting = leads.filter((l) => l.stage === "needs_approval").length;
  return (
    <>
      {sample && <SampleNote signedIn={signedIn} />}
      {waiting > 0 && (
        <p className="mb-4 text-sm">
          <span className="font-medium">{waiting} {waiting === 1 ? "pitch is" : "pitches are"} waiting for you.</span>{" "}
          <span className="text-muted-foreground">Nothing is sent until you approve it.</span>
        </p>
      )}
      <div className="pb-4 md:-mx-4 md:overflow-x-auto md:px-4">
        <div className="flex flex-col gap-5 md:flex-row md:gap-3">
          {columns.map((col) => {
            const cards = leads.filter((l) => l.stage === col.stage);
            return (
              <section key={col.stage} className="flex flex-col gap-2 md:w-60 md:shrink-0">
                <h2 className="flex items-center gap-2 px-1 text-sm font-medium">
                  <span className={cn("size-2 rounded-full", col.dot)} />
                  {col.title}
                  <span className="text-muted-foreground">{cards.length}</span>
                </h2>
                <div className="flex min-h-24 flex-col gap-2 rounded-lg bg-muted/60 p-2">
                  {cards.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Nothing here yet</p>}
                  {cards.map((card) => (
                    <Card key={card.key} card={card} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Card({ card }: { card: LeadCard }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{card.companyName}</p>
        {card.pitchId && <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {[card.sector, card.city].filter(Boolean).join(" · ")}
      </p>
      {card.topProblem && <p className="mt-2 text-xs">{card.topProblem}</p>}
      {card.skipReason && (
        <Badge variant="skipped" className="mt-2 whitespace-normal">
          {card.skipReason}
        </Badge>
      )}
      {card.stage === "replied" && (
        <Badge variant="replied" className="mt-2">
          Replied
        </Badge>
      )}
    </>
  );
  const cls = "block rounded-md border bg-background p-3 shadow-xs";
  return card.pitchId ? (
    <Link href={`/pitch/${card.pitchId}`} className={cn(cls, "transition-colors hover:border-primary/40")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
