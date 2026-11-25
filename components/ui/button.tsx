import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Button in the shadcn/ui style (written by hand, the shadcn site is blocked here).
export const buttonVariants = cva(
  "press inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_rgb(59_91_219/0.7)] hover:bg-primary/92",
        secondary: "bg-card text-foreground shadow-card hover:bg-accent",
        outline: "border bg-card hover:bg-accent",
        ghost: "hover:bg-accent",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4",
        lg: "h-13 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
