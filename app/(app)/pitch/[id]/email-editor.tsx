"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Send, X } from "lucide-react";
import { checkEmail } from "@/lib/pitch-rules";
import type { PitchDetail, PitchStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { approvePitch, saveDraft, skipPitch, type ActionResult } from "./actions";

type Props = {
  id: string;
  sample: boolean;
  status: PitchStatus;
  contact: PitchDetail["contact"];
  initial: { subject: string; body: string; personalLine: string };
};

// The email half of Pitch review. The rule checks run on every keystroke,
// and Approve stays off until they all pass.
export function EmailEditor({ id, sample, status, contact, initial }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [personalLine, setPersonalLine] = useState(initial.personalLine);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const checks = checkEmail(body);
  const allOk = checks.every((c) => c.ok);
  const editable = status === "draft";
  const draft = { subject, body, personalLine };

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    if (sample) {
      setResult({ ok: true, message: "Sample data: nothing was saved or sent." });
      return;
    }
    startTransition(async () => {
      const r = await action();
      setResult(r);
      if (r.ok) after?.();
    });
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Email draft</CardTitle>
          {!editable && <Badge variant={status === "replied" ? "replied" : "waiting"}>{status}</Badge>}
        </div>
        <CardDescription>
          {contact?.email ? (
            <>
              To {contact.name ? `${contact.name}${contact.role ? `, ${contact.role}` : ""} · ` : ""}
              <span className="text-foreground">{contact.email}</span>
              {contact.source && <> (from {contact.source.toLowerCase()})</>}
            </>
          ) : (
            "No contact email found yet."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!editable} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!editable}
            className="min-h-72 leading-relaxed"
          />
        </div>

        <ul className="grid gap-1.5 rounded-md bg-muted/60 p-3 text-sm sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-1.5">
              {c.ok ? (
                <Check className="mt-0.5 size-4 shrink-0 text-status-replied" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-destructive" />
              )}
              <span className={cn(!c.ok && "text-destructive")}>
                {c.label}
                {c.detail && <span className="text-muted-foreground"> · {c.detail}</span>}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personal">Your personal line (optional)</Label>
          <Input
            id="personal"
            placeholder="Something only you know is true, e.g. “I've been a patient here.”"
            value={personalLine}
            onChange={(e) => setPersonalLine(e.target.value)}
            disabled={!editable}
          />
          <p className="text-xs text-muted-foreground">Before you approve: would you say this to their face?</p>
        </div>

        {result && (
          <p className={cn("rounded-md px-3 py-2 text-sm", result.ok ? "bg-status-replied/10" : "bg-destructive/10 text-destructive")}>
            {result.message}
          </p>
        )}

        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!allOk || pending || !contact?.email}
              onClick={() => run(() => approvePitch(id, draft), () => router.refresh())}
            >
              <Send /> Approve and send
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => run(() => saveDraft(id, draft))}>
              Save edits
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => run(() => skipPitch(id), () => router.push("/pipeline"))}>
              Skip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
