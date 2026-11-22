import { askJson } from "@/lib/gemini";
import { BANNED_PHRASES, checkEmail, MAX_WORDS, MIN_WORDS } from "@/lib/pitch-rules";
import type { Finding, Student } from "@/lib/types";

// Step 8: write the first email in the student's own voice, following the
// pitch rules (docs/06-blueprint.md section 6). The code checks every draft
// with the same rules as the Pitch review screen and asks Gemini to rewrite
// it (up to 3 tries) if any rule fails.

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
}): Promise<Draft> {
  const { student, company, findings } = opts;
  const first = student.name.trim().split(/\s+/)[0] || student.name;
  const facts = findings.filter((f) => f.hard).slice(0, 2).map((f) => `- ${f.problem}: ${f.evidence}`).join("\n");
  const voice = student.voice_samples.filter((v) => v.trim()).slice(0, 3).map((v, i) => `Sample ${i + 1}:\n${v.trim()}`).join("\n\n");

  const base = `You are writing a short cold email for a student, in the student's own voice. It must read like they typed it themselves.

THE STUDENT
Name: ${student.name}
About: ${[student.bio, student.year_or_grad, student.city].filter(Boolean).join(", ") || "a student"}
What they offer: ${opts.offer}
${voice ? `How they write (copy this tone, word choice and sentence length, not the content):\n${voice}` : "No writing samples: write plainly and warmly, like a polite student."}

THE BUSINESS
Name: ${company.name}${company.city ? `, ${company.city}` : ""}${company.sector ? ` (${company.sector})` : ""}
Greet: ${opts.contactName ? opts.contactName : `"Hi ${company.name} team"`}
Facts found by real tools (use one, with its number, exactly as given; never invent other facts or praise):
${facts}

THE LINK (include it exactly once, on its own line): ${opts.pageUrl}

RULES
- ${MIN_WORDS} to ${MAX_WORDS} words in the body, counting the greeting and sign-off. Aim for about 80.
- Shape: who I am (one line), what I noticed (one fact with its number), what I made (the link), a small ask (a 10-minute call or WhatsApp this week), an easy way to say no (for example: if not, just reply "no" and I won't write again).
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
