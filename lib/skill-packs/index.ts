import { chatbotPack } from "./chatbot";
import { designPack } from "./design";
import { seoPack } from "./seo";
import type { SkillPack } from "./types";
import { webPack } from "./web";

export const skillPacks: SkillPack[] = [webPack, designPack, seoPack, chatbotPack];

export function packFor(skill: string): SkillPack {
  return skillPacks.find((p) => p.key === skill) ?? webPack;
}
