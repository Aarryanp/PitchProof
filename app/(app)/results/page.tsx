import type { Metadata } from "next";
import { Suspense } from "react";
import { getResults } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { SampleNote } from "@/components/sample-note";
import { ExportButton } from "./export-button";

export const metadata: Metadata = { title: "Results · Pitchproof" };

// Screen 6: Results. The numbers for the demo: what was sent, opened and
// answered, and whether audit pitches beat generic ones.
export default function ResultsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Results />
    </Suspense>
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
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{s.value}</p>
            {s.note && <p className="mt-0.5 text-xs text-muted-foreground">{s.note}</p>}
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
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
                    <span className="font-medium">{c.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {rate}% · {c.replied} of {c.sent}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted">
                    <div
                      className={c.label === "Audit pitch" ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-muted-foreground/40"}
                      style={{ width: `${(rate / best) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
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
