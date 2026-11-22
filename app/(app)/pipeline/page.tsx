import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus, Sparkles } from "lucide-react";
import { getLeads } from "@/lib/data";
import type { LeadCard, Stage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Loading } from "@/components/loading";
import { Avatar } from "@/components/avatar";
import { Reveal, Screen } from "@/components/screen";
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
    <Screen>
      <PageHeader
        title="Leads"
        description="Businesses the agent found, and where each pitch stands."
        actions={
          <Link href="/search" transitionTypes={["nav-forward"]} className={cn(buttonVariants(), "hidden md:inline-flex")}>
            <Plus /> New search
          </Link>
        }
      />
      <Reveal fallback={<Loading />}>
        <Board />
      </Reveal>
      {/* Round "new search" button floating above the tab bar on phones. */}
      <Link
        href="/search"
        transitionTypes={["tab"]}
        aria-label="New search"
        className="press fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30 flex size-14 items-center justify-center rounded-full bg-[#1b1d2a] text-white shadow-[0_12px_24px_-10px_rgb(27_29_42/0.7)] md:hidden"
      >
        <Plus className="size-6" />
      </Link>
    </Screen>
  );
}

async function Board() {
  const { leads, sample, signedIn, hasProfile } = await getLeads();
  const waiting = leads.filter((l) => l.stage === "needs_approval").length;
  const replied = leads.filter((l) => l.stage === "replied").length;
  const stats = [
    { label: "Found", value: leads.length },
    { label: "To approve", value: waiting, highlight: waiting > 0 },
    { label: "Replied", value: replied },
  ];
  const firstWaiting = leads.find((l) => l.stage === "needs_approval" && l.pitchId);
  return (
    <>
      {signedIn && !hasProfile && (
        <Link
          href="/onboarding"
          className="press press-soft settle mb-4 flex items-center gap-3 rounded-[22px] bg-primary p-4 text-primary-foreground shadow-[0_14px_30px_-14px_rgb(59_91_219/0.8)]"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-white/15">
            <Sparkles className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold">Finish setting up</span>
            <span className="block text-sm text-primary-foreground/80">A few questions so the agent knows what you offer.</span>
          </span>
          <ChevronRight className="size-5" />
        </Link>
      )}
      {sample && <SampleNote signedIn={signedIn} />}

      <div className="mb-4 grid grid-cols-3 gap-3">
        {stats.map((st, i) => (
          <div
            key={st.label}
            style={{ "--i": i } as React.CSSProperties}
            className={cn("settle rounded-[22px] bg-card px-4 py-3.5 shadow-card", st.highlight && "bg-primary text-primary-foreground")}
          >
            <p className="text-2xl font-extrabold tabular-nums leading-none">{st.value}</p>
            <p className={cn("mt-1.5 text-xs font-medium text-muted-foreground", st.highlight && "text-primary-foreground/80")}>{st.label}</p>
          </div>
        ))}
      </div>

      {firstWaiting && (
        <Link
          href={`/pitch/${firstWaiting.pitchId}`}
          transitionTypes={["nav-forward"]}
          style={{ "--i": 3 } as React.CSSProperties}
          className="press press-soft settle mb-5 flex items-center gap-3 rounded-[22px] bg-card p-4 shadow-card"
        >
          <span className="flex-1 text-sm">
            <span className="block font-bold">
              {waiting} {waiting === 1 ? "pitch is" : "pitches are"} waiting for you
            </span>
            <span className="block text-muted-foreground">Nothing is sent until you approve it.</span>
          </span>
          <span className="rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground">Review</span>
        </Link>
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
                <h2 className="flex items-center gap-2 px-1 text-sm font-bold">
                  <span className={cn("size-2 rounded-full", col.dot)} />
                  {col.title}
                  <span className="text-muted-foreground">{cards.length}</span>
                </h2>
                <div className="flex min-h-24 flex-col gap-2.5 rounded-[22px] bg-[#eceef7] p-2">
                  {cards.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Nothing here yet</p>}
                  {cards.map((card, i) => (
                    <Card key={card.key} card={card} index={i} />
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

function Card({ card, index }: { card: LeadCard; index: number }) {
  const body = (
    <>
      <div className="flex items-start gap-2.5">
        <Avatar name={card.companyName} className="size-8 text-sm" />
        <p className="min-w-0 flex-1 text-sm font-bold leading-snug">{card.companyName}</p>
        {card.pitchId && <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {[card.sector, card.city].filter(Boolean).join(" · ")}
      </p>
      {card.topProblem && <p className="mt-2 rounded-xl bg-[#fff1dc] px-2.5 py-1.5 text-xs font-medium text-[#a35a00]">{card.topProblem}</p>}
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
  const cls = "settle block rounded-[18px] bg-card p-3 shadow-card";
  const style = { "--i": index } as React.CSSProperties;
  return card.pitchId ? (
    <Link href={`/pitch/${card.pitchId}`} transitionTypes={["nav-forward"]} style={style} className={cn(cls, "press press-soft hover:shadow-[0_10px_28px_-12px_rgb(40_50_110/0.3)]")}>
      {body}
    </Link>
  ) : (
    <div style={style} className={cls}>{body}</div>
  );
}
