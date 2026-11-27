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

// Why the student is writing, from the goal they picked. Fixed text, so the
// model can't invent a reason.
const WHY: Record<string, string> = {
  freelance: "I'm starting out doing small website projects for local businesses",
  internship: "I'm building real experience by helping local businesses with their websites",
  job: "I'm building real experience by helping local businesses with their websites",
};

// What a fact means for the owner, in plain words. Raw scores and
// "1.9 s sooner" don't mean much to a clinic owner; "people leave" does.
// The seconds come from Google's test; the 3-second line is Google's own
// published research on phone visitors.
export function plainFact(f: Finding): string {
  if (f.problem === "Slow on phones") {
    const s = Number(f.evidence.match(/about ([\d.]+) seconds/)?.[1]);
    if (s) return `On a phone, the page takes about ${Math.round(s)} seconds before the main content shows (measured with Google's own speed test). Google's research says most people on phones leave a page that takes longer than 3 seconds, so some visitors may give up before they see the phone number or services.`;
    return `${f.evidence} (Google's own speed test). Slow pages lose visitors on phones before they see the phone number or services.`;
  }
  return `${f.problem}: ${f.evidence}`;
}

export async function draftEmail(opts: {
  student: Student;
  company: { name: string; city: string | null; sector: string | null };
  contactName: string | null;
  findings: Finding[];
  offer: string;
  pageUrl: string; // only put in the email when newSite
  tone?: Tone;
  newSite?: boolean; // no working website: the student made a simple new one
}): Promise<Draft> {
  const { student, company, findings } = opts;
  const first = student.name.trim().split(/\s+/)[0] || student.name;
  const facts = findings.filter((f) => f.hard).slice(0, 2).map((f) => `- ${plainFact(f)}`).join("\n");
  const tone = opts.tone ?? "friendly";
  const why = WHY[student.goal ?? ""] ?? WHY.internship;
  const kind = company.sector ? company.sector.toLowerCase() : "local businesses";
  const looking = `I was looking at ${kind}${company.city ? ` in ${company.city}` : ""} and checked their websites on my phone`;

  const base = `You are writing a short cold email for a student. It must read like they typed it themselves: a real person introducing themselves, not a sales pitch.

THE STUDENT
Full name: ${student.name}
Year: ${student.year_or_grad || "unknown, leave it out"}
About: ${student.bio || "a student"}
City: ${student.city || "unknown, leave it out"}
Why they're writing: ${why}
How they found this business: ${looking}
What they offer: ${opts.offer}

TONE: ${tone}. ${TONES[tone]}

THE BUSINESS
Name: ${company.name}${company.city ? `, ${company.city}` : ""}${company.sector ? ` (${company.sector})` : ""}
Greet: ${opts.contactName ? opts.contactName : `"Hi ${company.name} team"`}
What was found, by real tools. Use the first one (the second only if it fits naturally). Say it in plain words a shop owner understands, keeping its numbers as given, and say what it means for them. Never mention a "speed score", megabytes or technical terms. Never invent other facts, numbers or praise:
${facts}

${opts.newSite ? `THE LINK (include it exactly once, on its own line): ${opts.pageUrl}` : "NO LINK: do not put any link or web address in the email. Everything they need is in the email itself."}

RULES
- ${MIN_WORDS} to ${MAX_WORDS} words in the body, counting the greeting and sign-off. Aim for about ${tone === "short" ? 75 : 105}.
- Shape, one short paragraph each:
  1. A proper introduction: "I'm" + full name, year and what they study, the city, and in the same paragraph why they're writing and how they found this business (use the two lines above, in your own words).
  2. What I noticed and what it means for them.
  3. ${
    opts.newSite
      ? "What I made: a simple new website for them, at the link, which they can use as it is or ask me to change"
      : "What I can do: make their current website fast without changing how it looks. Never say you built a new site, a new version or a page for them"
  }, then a small ask (a 10-minute call this week) and an easy way to say no (for example: if not, just reply "no" and I won't write again).
- Plain text only: no bullet points, no bold, no emojis, no markdown.
- Layout: the greeting on its own line, then the paragraphs with a blank line between them${opts.newSite ? ", the link on its own line" : ""}, and the sign-off on its own line.
- Never use these phrases: ${BANNED_PHRASES.map((p) => `"${p}"`).join(", ")}.
- Sign off with just "${first}".
- Subject: short, plain, lowercase, like "your clinic's website on phones". No clickbait.

Answer as JSON with "subject" and "body".`;

  let prompt = base;
  let last: Draft = { subject: "", body: "", passes: false, problems: ["Not written yet"] };
  for (let attempt = 0; attempt < 3; attempt++) {
    const out = await askJson<{ subject: string; body: string }>(prompt, schema, { temperature: 0.7 });
    const body = tidy(out.body, opts.newSite ? opts.pageUrl : null);
    const failed = checkEmail(body).filter((c) => !c.ok);
    if (!opts.newSite && /https?:\/\/|www\./i.test(body)) failed.push({ label: "No link in a slow-site email", ok: false });
    last = { subject: out.subject.trim(), body, passes: failed.length === 0, problems: failed.map((c) => `${c.label}${c.detail ? ` (${c.detail})` : ""}`) };
    if (last.passes) return last;
    prompt = `${base}\n\nYour last draft broke these rules: ${last.problems.join("; ")}. Rewrite it so every rule passes.\nLast draft:\n${body}`;
  }
  return last;
}

// Small models sometimes return one long paragraph. Put the link on its own
// line so it is easy to tap, and keep blank lines to at most one.
function tidy(text: string, url: string | null): string {
  let body = text.replace(/\r\n/g, "\n").trim();
  const i = url ? body.indexOf(url) : -1;
  if (url && i >= 0) body = `${body.slice(0, i).trimEnd()}\n\n${url}\n\n${body.slice(i + url.length).replace(/^[.,;:!]+/, "").trimStart()}`;
  return body.replace(/\n{3,}/g, "\n\n").trim();
}
