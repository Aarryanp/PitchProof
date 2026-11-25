import { cn } from "@/lib/utils";

// A round, colourful circle with the first letter of a business name. The
// colour is picked from the name, so the same business always gets the same one.
const palette = [
  "bg-[#ffe3e3] text-[#c92a2a]",
  "bg-[#e3fafc] text-[#0b7285]",
  "bg-[#fff3bf] text-[#946800]",
  "bg-[#e7ecff] text-[#3b5bdb]",
  "bg-[#e6fcf5] text-[#087f5b]",
  "bg-[#f3f0ff] text-[#6741d9]",
];

export function Avatar({ name, className }: { name: string; className?: string }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-full text-base font-bold", palette[h % palette.length], className)}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
