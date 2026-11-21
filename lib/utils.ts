import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Joins CSS class names and removes Tailwind classes that clash.
// shadcn/ui components use this everywhere.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
