import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Small coloured label. Status colours follow docs/09-design-guide.md:
// green = replied, amber = waiting, grey = skipped, red only for errors.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        primary: "bg-[#e7ecff] text-primary",
        replied: "bg-[#e3f7ec] text-[#1d7a4a]",
        waiting: "bg-[#fff1dc] text-[#a35a00]",
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
