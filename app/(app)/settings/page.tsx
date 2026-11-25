import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight, LogOut, Mail, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallApp } from "@/components/install-app";
import { PageHeader } from "@/components/page-header";
import { Screen } from "@/components/screen";

export const metadata: Metadata = { title: "Settings · Pitchproof" };

// Settings: install the app, Gmail connection, daily limit, tour, sign out.
export default function SettingsPage() {
  return (
    <Screen>
      <Link
        href="/profile"
        transitionTypes={["nav-back"]}
        className="press mb-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-card pr-4 pl-3 text-sm font-semibold shadow-card md:hidden"
      >
        <ArrowLeft className="size-4" /> Me
      </Link>
      <PageHeader title="Settings" />
      <div className="flex max-w-2xl flex-col gap-4">
        <Card className="settle" style={{ "--i": 0 } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Install on your phone</CardTitle>
            <CardDescription>Opens full screen from your home screen, like any other app.</CardDescription>
          </CardHeader>
          <CardContent>
            <InstallApp />
          </CardContent>
        </Card>
        <Card className="settle" style={{ "--i": 1 } as React.CSSProperties}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Gmail</CardTitle>
              <Badge variant="skipped">Not connected</Badge>
            </div>
            <CardDescription>Approved emails are sent from your own Gmail, so replies come straight to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" disabled>
              <Mail /> Connect Gmail
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Coming with step 9 (approve and send).</p>
          </CardContent>
        </Card>
        <Card className="settle" style={{ "--i": 2 } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Daily limit</CardTitle>
            <CardDescription>
              At most 15 new pitches a day, and at most 2 follow-ups per business. Follow-ups stop on any reply.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold tabular-nums text-primary">15</p>
            <p className="text-sm text-muted-foreground">new emails per day</p>
          </CardContent>
        </Card>
        <Card className="settle divide-y overflow-hidden p-0" style={{ "--i": 3 } as React.CSSProperties}>
          <Link href="/tour" className="press-soft press flex items-center gap-3 px-5 py-4 text-sm font-semibold hover:bg-accent">
            <PlayCircle className="size-4 text-muted-foreground" />
            <span className="flex-1">Replay the tour</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <form action="/auth/sign-out" method="post">
            <button className="press-soft press flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-destructive hover:bg-accent">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </Card>
      </div>
    </Screen>
  );
}
