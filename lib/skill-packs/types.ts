import type { Finding } from "@/lib/types";
import type { SiteFacts } from "./facts";

// A skill pack (docs/06-blueprint.md section 5): which problems matter for
// one skill, and how the email talks about them. Adding a skill = adding a pack.
export type SkillPack = {
  key: string; // matches the skill keys in the app: web, design, seo, chatbot
  name: string;
  offer: string; // what the student offers, in a few plain words, for the email
  rebuildOffer?: string; // the offer when the business has no working website
  findings: (f: SiteFacts) => Finding[];
};

// Problems every pack shares: the site doesn't open, or it's a "for sale" page.
export function brokenSite(f: SiteFacts): Finding[] {
  if (f.parked) return [{ problem: "Your website address shows a “domain for sale” page", evidence: `${f.url} opens a parked page instead of your site`, source: "Website read (Olostep)", hard: true }];
  if (f.opens === false) return [{ problem: "Your website doesn't open", evidence: `${f.url} did not load when I tried it`, source: "Website check", hard: true }];
  return [];
}

export function abandoned(f: SiteFacts, now = new Date()): Finding[] {
  if (f.copyrightYear && now.getFullYear() - f.copyrightYear >= 2)
    return [{ problem: "The site looks out of date", evidence: `The footer still says © ${f.copyrightYear}`, source: "Website read (Olostep)", hard: true }];
  return [];
}

// No working website: it doesn't open, it's a "for sale" page, or none is listed.
// Only then does the student build a new page; working sites get measured fixes instead.
export function needsNewSite(findings: Finding[]): boolean {
  return findings.some((f) => f.hard && /doesn't open|domain for sale|^No website$/i.test(f.problem));
}

// Hard problems first, at most three.
export function top3(list: Finding[]): Finding[] {
  return [...list.filter((x) => x.hard), ...list.filter((x) => !x.hard)].slice(0, 3);
}
