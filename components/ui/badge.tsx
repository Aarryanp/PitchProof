import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Small coloured label. Status colours follow docs/09-design-guide.md:
// green = replied, amber = waiting, grey = skipped, red only for errors.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        primary: "bg-primary/10 text-primary",
        replied: "bg-status-replied/15 text-[oklch(0.42_0.12_150)]",
        waiting: "bg-status-waiting/20 text-[oklch(0.45_0.1_70)]",
        skipped: "bg-muted text-muted-foreground",
        error: "bg-destructive/10 text-destructive",
        outline: "border text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
