import Link from "next/link";
import { FlaskConical } from "lucide-react";

// Shown above any screen that is showing sample data instead of real rows.
export function SampleNote({ signedIn, children }: { signedIn: boolean; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-2.5 rounded-2xl bg-[#fff1dc] px-4 py-3 text-sm text-[#6b3d00]">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-[#a35a00]" />
      <p>
        <span className="font-medium">Sample data.</span>{" "}
        {children ??
          (signedIn
            ? "These are made-up businesses. Your real leads show here once the agent runs."
            : "These are made-up businesses so you can see how the app works.")}{" "}
        {!signedIn && (
          <Link href="/sign-in" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        )}
      </p>
    </div>
  );
}
