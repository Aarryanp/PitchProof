// Email rules from docs/06-blueprint.md section 6.
// The Pitch review screen runs these on every edit, and the email step will
// run them before saving a draft.

export const BANNED_PHRASES = [
  "i hope this email finds you well",
  "esteemed organization",
  "elevate",
  "leverage",
  "seamless",
  "i came across your company",
];

export const MIN_WORDS = 60;
// 130, not 100: the email opens with a short, proper introduction of the
// student (Aarryan's feedback, 27 Nov), which needs about 30 more words.
export const MAX_WORDS = 130;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countLinks(text: string): number {
  return (text.match(/https?:\/\/\S+|\[link\]/gi) ?? []).length;
}

export type RuleCheck = { label: string; ok: boolean; detail?: string };

export function checkEmail(body: string): RuleCheck[] {
  const lower = body.toLowerCase();
  const words = countWords(body);
  const found = BANNED_PHRASES.filter((p) => lower.includes(p));
  const links = countLinks(body);
  const hasOptOut = /\bno\b|not interested|won't write again|unsubscribe/i.test(body);

  return [
    {
      label: `${MIN_WORDS}–${MAX_WORDS} words`,
      ok: words >= MIN_WORDS && words <= MAX_WORDS,
      detail: `${words} words`,
    },
    {
      label: "No banned phrases",
      ok: found.length === 0,
      detail: found.length ? `Found: “${found.join("”, “")}”` : undefined,
    },
    // At most one link. A slow-site email has none: the facts are in the email
    // itself. A dead-site email links to the new website that was made.
    { label: "At most one link", ok: links <= 1, detail: `${links} found` },
    { label: "Easy way to say no", ok: hasOptOut },
    {
      label: "Plain text (no bullets, bold or emojis)",
      ok: !/(^|\n)\s*[-*•]\s|\*\*|[\u{1F300}-\u{1FAFF}]/u.test(body),
    },
  ];
}

export function emailPasses(body: string): boolean {
  return checkEmail(body).every((c) => c.ok);
}

// Nothing is sent unless the student pressed Approve (status "approved" with
// a time), and the email still passes every rule. The Gmail step (step 9)
// must call this right before sending.
export function canSend(pitch: { status: string; approved_at: string | null; email_body: string | null }): boolean {
  return pitch.status === "approved" && Boolean(pitch.approved_at) && emailPasses(pitch.email_body ?? "");
}
