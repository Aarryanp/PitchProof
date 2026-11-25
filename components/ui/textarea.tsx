import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-20 w-full rounded-2xl border bg-card px-4 py-3 text-[15px] shadow-xs placeholder:text-muted-foreground focus-visible:outline-none transition-shadow focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
