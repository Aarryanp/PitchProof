import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LogOut, Mail, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallApp } from "@/components/install-app";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Settings · Pitchproof" };

// Settings: install the app, Gmail connection, daily limit, tour, sign out.
export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Install on your phone</CardTitle>
            <CardDescription>Opens full screen from your home screen, like any other app.</CardDescription>
          </CardHeader>
          <CardContent>
            <InstallApp />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Gmail</CardTitle>
              <Badge variant="skipped">Not connected</Badge>
            </div>
            <CardDescription>Approved emails are sent from your own Gmail, so replies come straight to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              <Mail /> Connect Gmail
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Coming with step 9 (approve and send).</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Daily limit</CardTitle>
            <CardDescription>
              At most 15 new pitches a day, and at most 2 follow-ups per business. Follow-ups stop on any reply.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">15</p>
            <p className="text-sm text-muted-foreground">new emails per day</p>
          </CardContent>
        </Card>
        <Card className="divide-y overflow-hidden p-0">
          <Link href="/tour" className="flex items-center gap-3 px-5 py-4 text-sm hover:bg-accent">
            <PlayCircle className="size-4 text-muted-foreground" />
            <span className="flex-1">Replay the tour</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <form action="/auth/sign-out" method="post">
            <button className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm text-destructive hover:bg-accent">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
