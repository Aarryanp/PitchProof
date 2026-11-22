import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, Gauge, MessageCircleQuestion } from "lucide-react";
import { getPitch } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingDetail } from "@/components/loading";
import { Reveal, Screen } from "@/components/screen";
import { SampleNote } from "@/components/sample-note";
import { Avatar } from "@/components/avatar";
import { EmailEditor } from "./email-editor";

export const metadata: Metadata = { title: "Pitch review · Pitchproof" };

// Screen 5: Pitch review. Audit findings with evidence, the fix preview,
// the company page, and the email draft the student approves.
export default function PitchPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Screen>
      <Link
        href="/pipeline"
        transitionTypes={["nav-back"]}
        className="press mb-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-card pr-4 pl-3 text-sm font-semibold shadow-card"
      >
        <ArrowLeft className="size-4" /> Leads
      </Link>
      <Reveal fallback={<LoadingDetail />}>
        <Review params={params} />
      </Reveal>
    </Screen>
  );
}

async function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { pitch, sample } = await getPitch(id);
  if (!pitch) notFound();
  const signedIn = Boolean(await getSessionUser());
  const hard = pitch.findings.filter((f) => f.hard);

  return (
    <>
      {sample && <SampleNote signedIn={signedIn}>This is a made-up business. Approving here does nothing.</SampleNote>}
      <div className="settle mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={pitch.company.name} className="size-13 text-xl" />
          <div>
          <h1 className="text-[24px] font-extrabold leading-tight tracking-tight">{pitch.company.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[pitch.company.sector, pitch.company.city, pitch.company.website].filter(Boolean).join(" · ")}
          </p>
          </div>
        </div>
        <Badge variant={pitch.pitchType === "audit" ? "primary" : "outline"}>
          {pitch.pitchType === "audit" ? "Audit pitch" : "Generic pitch"}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          <Card className="settle" style={{ "--i": 1 } as React.CSSProperties}>
            <CardHeader>
              <CardTitle>What the audit found</CardTitle>
              <CardDescription>
                {hard.length > 0
                  ? `Passed the quality gate: ${hard.length} ${hard.length === 1 ? "problem has" : "problems have"} hard evidence.`
                  : "No problem has hard evidence yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {pitch.findings.map((f, i) => (
                <div key={i} className={f.hard ? "rounded-2xl bg-[#fff8ec] p-3.5" : "rounded-2xl bg-muted p-3.5"}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{f.problem}</p>
                    {f.hard ? (
                      <Badge variant="replied">
                        <CheckCircle2 className="size-3" /> Hard evidence
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <MessageCircleQuestion className="size-3" /> Opinion
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{f.evidence}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Source: {f.source}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="settle" style={{ "--i": 2 } as React.CSSProperties}>
            <CardHeader>
              <CardTitle>Fix preview</CardTitle>
              <CardDescription>The faster version of their homepage, made for this pitch.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <PreviewBox label="Their site today" value={sample ? "9.1 s" : "—"} tone="before" />
                <PreviewBox label="Your fixed version" value={sample ? "1.8 s" : "—"} tone="after" />
              </div>
              {pitch.fixUrl ? (
                <a href={pitch.fixUrl} target="_blank" className="press mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e7ecff] px-4 py-2 text-sm font-semibold text-primary">
                  Open the fix <ExternalLink className="size-3.5" />
                </a>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">The real preview is added in step 6 (make the fix).</p>
              )}
            </CardContent>
          </Card>

          {pitch.pageSlug && (
            <Card className="settle" style={{ "--i": 3 } as React.CSSProperties}>
              <CardHeader>
                <CardTitle>Company page</CardTitle>
                <CardDescription>The private page your email links to. Hidden from search engines.</CardDescription>
              </CardHeader>
              <CardContent>
                <a href={`/p/${pitch.pageSlug}`} target="_blank" className="press inline-flex items-center gap-1.5 rounded-full bg-[#e7ecff] px-4 py-2 text-sm font-semibold text-primary">
                  Preview the page <ExternalLink className="size-3.5" />
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        <EmailEditor
          id={pitch.id}
          sample={sample}
          status={pitch.status}
          contact={pitch.contact}
          initial={{ subject: pitch.emailSubject, body: pitch.emailBody, personalLine: pitch.personalLine }}
        />
      </div>
    </>
  );
}

function PreviewBox({ label, value, tone }: { label: string; value: string; tone: "before" | "after" }) {
  return (
    <div className="rounded-2xl bg-muted p-3">
      <div className="mb-3 flex h-36 flex-col gap-1.5 rounded-xl bg-card p-2">
        <div className={tone === "after" ? "h-3 w-2/3 rounded bg-primary/30" : "h-3 w-full rounded bg-muted-foreground/25"} />
        <div className="h-2 w-full rounded bg-muted-foreground/15" />
        <div className="h-2 w-5/6 rounded bg-muted-foreground/15" />
        {tone === "after" ? (
          <div className="mt-auto h-5 w-1/2 rounded bg-status-replied/60" />
        ) : (
          <div className="mt-2 flex-1 rounded bg-muted-foreground/10" />
        )}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={tone === "after" ? "flex items-center gap-1 text-lg font-extrabold text-[#1d7a4a]" : "flex items-center gap-1 text-lg font-extrabold"}>
        <Gauge className="size-4 text-muted-foreground" /> {value}
      </p>
    </div>
  );
}
