"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Results = {
  sent: number;
  opened: number;
  replied: number;
  positive: number;
  audit: { sent: number; replied: number };
  generic: { sent: number; replied: number };
};

// Downloads the numbers as a CSV file (opens in Excel or Google Sheets).
export function ExportButton({ results: r }: { results: Results }) {
  function download() {
    const rows = [
      ["metric", "value"],
      ["sent", r.sent],
      ["pages_opened", r.opened],
      ["replies", r.replied],
      ["positive_replies", r.positive],
      ["audit_sent", r.audit.sent],
      ["audit_replied", r.audit.replied],
      ["generic_sent", r.generic.sent],
      ["generic_replied", r.generic.replied],
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pitchproof-results.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <Button variant="secondary" onClick={download}>
      <Download /> Export numbers
    </Button>
  );
}
