import type { Finding } from "@/lib/types";
import { brokenSite, top3, type SkillPack } from "./types";

// SEO and marketing: can people find the business on Google?
export const seoPack: SkillPack = {
  key: "seo",
  name: "SEO and marketing",
  offer: "page titles, descriptions and fixes so the site shows up better on Google",
  findings(f) {
    const broken = brokenSite(f);
    if (broken.length) return broken;
    const out: Finding[] = [];
    if (f.seo !== null && f.seo < 70) out.push({ problem: "Hard to find on Google", evidence: `Google's SEO score is ${f.seo}/100`, source: "Google PageSpeed Insights", hard: true });
    if (f.hasTitle === false) out.push({ problem: "No page title", evidence: "The home page has no title, so Google shows a blank or messy heading", source: "Google PageSpeed Insights", hard: true });
    if (f.hasDescription === false) out.push({ problem: "No search description", evidence: "The home page has no meta description for Google to show under the link", source: "Google PageSpeed Insights", hard: true });
    if (!f.https) out.push({ problem: "Not secure", evidence: "No HTTPS, which Google ranks lower", source: "Website check", hard: true });
    return top3(out);
  },
};
