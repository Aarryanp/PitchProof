import Link from "next/link";
import { FlaskConical } from "lucide-react";

// Shown above any screen that is showing sample data instead of real rows.
export function SampleNote({ signedIn, children }: { signedIn: boolean; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-2.5 rounded-md border border-status-waiting/40 bg-status-waiting/10 px-3.5 py-2.5 text-sm">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-[oklch(0.5_0.1_70)]" />
      <p>
        <span className="font-medium">Sample data.</span>{" "}
        {children ??
          (signedIn
            ? "These are made-up businesses. Your real leads show here once the agent runs."
            : "These are made-up businesses so you can see how the app works.")}{" "}
        {!signedIn && (
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        )}
      </p>
    </div>
  );
}
