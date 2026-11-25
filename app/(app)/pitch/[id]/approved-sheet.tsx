"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// The moment after pressing Approve: a sheet slides up from the bottom, a
// green circle pops in and a check draws itself, like a payment-done screen.
export function ApprovedSheet({ sample, company, onDone }: { sample: boolean; company: string | null; onDone: () => void }) {
  const [closing, setClosing] = useState(false);

  function close() {
    setClosing(true);
    setTimeout(onDone, 260);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Pitch approved">
      <button
        aria-label="Close"
        onClick={close}
        className={closing ? "pp-scrim-out absolute inset-0 bg-[#1b1d2a]/40" : "pp-scrim absolute inset-0 bg-[#1b1d2a]/40"}
      />
      <div
        className={
          (closing ? "pp-sheet-out " : "pp-sheet ") +
          "relative w-full max-w-md rounded-t-[28px] bg-card px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+24px)] text-center shadow-2xl sm:rounded-[28px] sm:pb-6"
        }
      >
        <div className="mx-auto mb-6 h-1.5 w-10 rounded-full bg-muted sm:hidden" />
        <div className="pp-pop mx-auto flex size-20 items-center justify-center rounded-full bg-[#2f9e44] shadow-[0_12px_28px_-10px_rgb(47_158_68/0.8)]" style={{ animationDelay: "120ms" }}>
          <svg viewBox="0 0 32 32" className="size-11">
            <path d="M8.5 16.5l5 5 10-11" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="pp-draw" style={{ animationDelay: "380ms" }} />
          </svg>
        </div>
        <h2 className="pp-rise mt-5 text-xl font-extrabold tracking-tight" style={{ animationDelay: "300ms" }}>
          {sample ? "That's how approving feels" : "Approved"}
        </h2>
        <p className="pp-rise mx-auto mt-2 max-w-xs text-sm text-muted-foreground" style={{ animationDelay: "380ms" }}>
          {sample
            ? "This is sample data, so nothing was saved or sent."
            : `Your email${company ? ` to ${company}` : ""} is approved. It goes out with today's batch once Gmail is connected.`}
        </p>
        <Button size="lg" className="pp-rise mt-6 w-full" style={{ animationDelay: "460ms" }} onClick={close}>
          Back to leads
        </Button>
      </div>
    </div>
  );
}
