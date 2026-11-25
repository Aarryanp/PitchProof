import type { Finding } from "@/lib/types";
import { abandoned, brokenSite, top3, type SkillPack } from "./types";

// Design: version 1 uses the facts we can measure (broken on phones, out of
// date). Judging the look from a screenshot with Gemini is in docs/10-whats-next.md.
export const designPack: SkillPack = {
  key: "design",
  name: "Design",
  offer: "a cleaner, modern design for the home page",
  findings(f) {
    const broken = brokenSite(f);
    if (broken.length) return broken;
    const out: Finding[] = [];
    if (f.hasViewport === false)
      out.push({ problem: "Layout breaks on phones", evidence: "Fails Google's mobile check: the page isn't set up for phone screens", source: "Google PageSpeed Insights (mobile)", hard: true });
    out.push(...abandoned(f));
    if (f.performance !== null && f.performance < 50)
      out.push({ problem: "Heavy pages", evidence: `Mobile speed score ${f.performance}/100, often from large images`, source: "Google PageSpeed Insights (mobile)", hard: true });
    return top3(out);
  },
};
