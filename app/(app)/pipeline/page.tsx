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
import { PhoneLeads } from "./phone-leads";

export const metadata: Metadata = { title: "Leads · Pitchproof" };

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
        title="Leads"
        description="Businesses the agent found, and where each pitch stands."
        actions={
          <Link href="/search" className={buttonVariants()}>
            <Plus /> <span className="hidden sm:inline">New search</span><span className="sm:hidden">Search</span>
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
  const { leads, sample, signedIn, hasProfile } = await getLeads();
  const waiting = leads.filter((l) => l.stage === "needs_approval").length;
  return (
    <>
      {signedIn && !hasProfile && (
        <Link href="/onboarding" className="mb-4 flex items-center gap-3 rounded-xl bg-primary p-4 text-primary-foreground">
          <span className="flex-1">
            <span className="block font-medium">Finish setting up</span>
            <span className="block text-sm text-primary-foreground/80">A few questions so the agent knows what you offer.</span>
          </span>
          <ChevronRight className="size-5" />
        </Link>
      )}
      {sample && <SampleNote signedIn={signedIn} />}
      {waiting > 0 && (
        <p className="mb-4 text-sm">
          <span className="font-medium">{waiting} {waiting === 1 ? "pitch is" : "pitches are"} waiting for you.</span>{" "}
          <span className="text-muted-foreground">Nothing is sent until you approve it.</span>
        </p>
      )}
      <div className="md:hidden">
        <PhoneLeads leads={leads} columns={columns.map(({ stage, title }) => ({ stage, title }))} />
      </div>
      <div className="hidden pb-4 md:-mx-8 md:block md:overflow-x-auto md:px-8">
        <div className="flex gap-3">
          {columns.map((col) => {
            const cards = leads.filter((l) => l.stage === col.stage);
            return (
              <section key={col.stage} className="flex w-60 shrink-0 flex-col gap-2">
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
  const cls = "block rounded-lg border bg-background p-3 shadow-xs";
  return card.pitchId ? (
    <Link href={`/pitch/${card.pitchId}`} className={cn(cls, "transition-colors hover:border-primary/40")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
