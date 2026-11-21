import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Settings · Pitchproof" };

// Settings: the Gmail connection and the daily sending limit.
export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Gmail</CardTitle>
              <Badge variant="skipped">Not connected</Badge>
            </div>
            <CardDescription>
              Approved emails are sent from your own Gmail, so replies come straight to you.
            </CardDescription>
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
      </div>
    </>
  );
}
