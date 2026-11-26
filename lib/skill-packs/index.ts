import type { Finding } from "@/lib/types";
import { chatbotPack } from "./chatbot";
import type { SiteFacts } from "./facts";
import { designPack } from "./design";
import { seoPack } from "./seo";
import { top3, type SkillPack } from "./types";
import { webPack } from "./web";

export const skillPacks: SkillPack[] = [webPack, designPack, seoPack, chatbotPack];

// The app's skills arrive as a list (or "web,seo"). Skills without a pack yet
// (content, social, video, app) are ignored; with none left we use web.
export { needsNewSite } from "./types";

export function parseSkills(input: unknown): string[] {
  const list = Array.isArray(input) ? input.map(String) : String(input ?? "").split(",");
  const clean = [...new Set(list.map((s) => s.trim().toLowerCase()).filter(Boolean))];
  return clean.length ? clean : ["web"];
}

export function packsFor(skills: string[]): SkillPack[] {
  const packs = skillPacks.filter((p) => skills.includes(p.key));
  return packs.length ? packs : [webPack];
}

export function packFor(skill: string): SkillPack {
  return packsFor([skill])[0];
}

// Problems from every chosen pack, without repeats, at most three.
export function findingsFor(packs: SkillPack[], facts: SiteFacts): Finding[] {
  const seen = new Set<string>();
  const all = packs.flatMap((p) => p.findings(facts)).filter((f) => (seen.has(f.evidence) ? false : (seen.add(f.evidence), true)));
  return top3(all);
}

// What the student offers, in plain words, for the email.
// With no working website, the web pack offers a new site instead of fixes.
export function offerFor(packs: SkillPack[], newSite = false): string {
  return packs.map((p) => (newSite && p.rebuildOffer ? p.rebuildOffer : p.offer)).slice(0, 2).join(", and ");
}
