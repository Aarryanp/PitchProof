import type { Metadata } from "next";
import { getResults } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import { Reveal, Screen } from "@/components/screen";
import { PageHeader } from "@/components/page-header";
import { SampleNote } from "@/components/sample-note";
import { ExportButton } from "./export-button";

export const metadata: Metadata = { title: "Results · Pitchproof" };

// Screen 6: Results. The numbers for the demo: what was sent, opened and
// answered, and whether audit pitches beat generic ones.
export default function ResultsPage() {
  return (
    <Screen>
      <Reveal fallback={<Loading rows={2} />}>
        <Results />
      </Reveal>
    </Screen>
  );
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

async function Results() {
  const { results: r, sample } = await getResults();
  const user = await getSessionUser();
  const stats = [
    { label: "Emails sent", value: r.sent },
    { label: "Pages opened", value: r.opened, note: `${pct(r.opened, r.sent)}% of sent` },
    { label: "Replies", value: r.replied, note: `${pct(r.replied, r.sent)}% of sent` },
    { label: "Positive replies", value: r.positive },
  ];
  const compare = [
    { label: "Audit pitch", ...r.audit },
    { label: "Generic pitch", ...r.generic },
  ];
  const best = Math.max(...compare.map((c) => pct(c.replied, c.sent)), 1);

  return (
    <>
      <PageHeader
        title="Results"
        description="How your pitches are doing."
        actions={<ExportButton results={r} />}
      />
      {sample && <SampleNote signedIn={Boolean(user)}>These numbers are made up. Yours show here after your first emails go out.</SampleNote>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={s.label} className={i === 2 ? "settle bg-primary p-4 text-primary-foreground" : "settle p-4"} style={{ "--i": i } as React.CSSProperties}>
            <p className={i === 2 ? "text-sm font-medium text-primary-foreground/80" : "text-sm font-medium text-muted-foreground"}>{s.label}</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums">{s.value}</p>
            {s.note && <p className={i === 2 ? "mt-0.5 text-xs text-primary-foreground/80" : "mt-0.5 text-xs text-muted-foreground"}>{s.note}</p>}
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:mt-6 md:grid-cols-2 md:gap-6">
        <Card className="settle" style={{ "--i": 4 } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Audit pitch vs generic pitch</CardTitle>
            <CardDescription>Reply rate for each kind of email, sent to similar businesses.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {compare.map((c) => {
              const rate = pct(c.replied, c.sent);
              return (
                <div key={c.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-bold">{c.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {rate}% · {c.replied} of {c.sent}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted">
                    <div
                      className={(c.label === "Audit pitch" ? "bg-primary" : "bg-muted-foreground/40") + " pp-grow h-full origin-left rounded-full"}
                      style={{ width: `${(rate / best) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="settle" style={{ "--i": 5 } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Skills to learn next</CardTitle>
            <CardDescription>Problems the agent found that your skills don&apos;t cover yet.</CardDescription>
          </CardHeader>
          <CardContent>
            {r.skillGaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet.</p>
            ) : (
              <ul className="divide-y">
                {r.skillGaps.map((g) => (
                  <li key={g.skill} className="flex justify-between py-2 text-sm">
                    <span>{g.skill}</span>
                    <span className="text-muted-foreground">
                      {g.count} {g.count === 1 ? "business" : "businesses"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
