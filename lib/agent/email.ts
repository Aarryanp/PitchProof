import { askJson } from "@/lib/gemini";
import { BANNED_PHRASES, checkEmail, MAX_WORDS, MIN_WORDS } from "@/lib/pitch-rules";
import type { Finding, Student } from "@/lib/types";

// Step 8: write the first email, in the tone the student picks (friendly by
// default; they can ask for another tone or write their own), following the
// pitch rules (docs/06-blueprint.md section 6). The code checks every draft
// with the same rules as the Pitch review screen and asks Gemini to rewrite
// it (up to 3 tries) if any rule fails.

export const TONES = {
  friendly: "Warm and relaxed, like a helpful neighbour. Plain, everyday words.",
  formal: "Polite and professional. Full sentences, no slang, no exclamation marks.",
  short: "As short as the rules allow (about 60 words). Every sentence does one job.",
} as const;
export type Tone = keyof typeof TONES;
export const isTone = (t: unknown): t is Tone => typeof t === "string" && t in TONES;

export type Draft = { subject: string; body: string; passes: boolean; problems: string[] };

const schema = {
  type: "object",
  properties: { subject: { type: "string" }, body: { type: "string" } },
  required: ["subject", "body"],
};

export async function draftEmail(opts: {
  student: Student;
  company: { name: string; city: string | null; sector: string | null };
  contactName: string | null;
  findings: Finding[];
  offer: string;
  pageUrl: string;
  tone?: Tone;
}): Promise<Draft> {
  const { student, company, findings } = opts;
  const first = student.name.trim().split(/\s+/)[0] || student.name;
  const facts = findings.filter((f) => f.hard).slice(0, 2).map((f) => `- ${f.problem} (${f.evidence})`).join("\n");
  const tone = opts.tone ?? "friendly";

  const base = `You are writing a short cold email for a student. It must read like they typed it themselves.

THE STUDENT
Name: ${student.name}
About: ${[student.bio, student.year_or_grad, student.city].filter(Boolean).join(", ") || "a student"}
What they offer: ${opts.offer}

TONE: ${tone}. ${TONES[tone]}

THE BUSINESS
Name: ${company.name}${company.city ? `, ${company.city}` : ""}${company.sector ? ` (${company.sector})` : ""}
Greet: ${opts.contactName ? opts.contactName : `"Hi ${company.name} team"`}
Facts found by real tools. Mention the first one (and the second only if it fits naturally). Say it in your own plain words, the way you'd tell a friend, keeping any number exactly as given. Never invent other facts, numbers or praise:
${facts}

THE LINK (include it exactly once, on its own line): ${opts.pageUrl}

RULES
- ${MIN_WORDS} to ${MAX_WORDS} words in the body, counting the greeting and sign-off. Aim for about ${tone === "short" ? 62 : 80}.
- Shape: who I am (one line), what I noticed (the fact, with its number if it has one), what I made (a version of their home page that fixes it, at the link), a small ask (a 10-minute call or WhatsApp this week), an easy way to say no (for example: if not, just reply "no" and I won't write again).
- Plain text only: no bullet points, no bold, no emojis, no markdown.
- Never use these phrases: ${BANNED_PHRASES.map((p) => `"${p}"`).join(", ")}.
- Sign off with just "${first}".
- Subject: short, plain, lowercase, like "your clinic's website on phones". No clickbait.

Answer as JSON with "subject" and "body".`;

  let prompt = base;
  let last: Draft = { subject: "", body: "", passes: false, problems: ["Not written yet"] };
  for (let attempt = 0; attempt < 3; attempt++) {
    const out = await askJson<{ subject: string; body: string }>(prompt, schema, { temperature: 0.7 });
    const body = out.body.replace(/\r\n/g, "\n").trim();
    const failed = checkEmail(body).filter((c) => !c.ok);
    last = { subject: out.subject.trim(), body, passes: failed.length === 0, problems: failed.map((c) => `${c.label}${c.detail ? ` (${c.detail})` : ""}`) };
    if (last.passes) return last;
    prompt = `${base}\n\nYour last draft broke these rules: ${last.problems.join("; ")}. Rewrite it so every rule passes.\nLast draft:\n${body}`;
  }
  return last;
}
