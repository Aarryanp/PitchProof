import { cachedPagesFor } from "@/lib/agent/cache";
import { askJson } from "@/lib/gemini";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Finding } from "@/lib/types";

// Step 6: make the fix. Gemini fills a small JSON template from the
// business's OWN website text (pages we already read, so no new credits).
// Next.js then shows it at /p/[slug]/preview as a light, phone-first home
// page with call and WhatsApp buttons. Phone numbers and the email are only
// kept if they really appear in the site's text, so nothing is made up.

export type FixPage = {
  name: string;
  tagline: string;
  about: string;
  services: string[];
  highlights: string[];
  address: string | null;
  hours: string | null;
  phones: string[];
  email: string | null;
  whatsapp: string | null; // digits only, with country code, for wa.me links
};

const schema = {
  type: "object",
  properties: {
    tagline: { type: "string" },
    about: { type: "string" },
    services: { type: "array", items: { type: "string" } },
    highlights: { type: "array", items: { type: "string" } },
    address: { type: "string", nullable: true },
    hours: { type: "string", nullable: true },
    phones: { type: "array", items: { type: "string" } },
    email: { type: "string", nullable: true },
  },
  required: ["tagline", "about", "services", "highlights", "phones"],
};

// What the new version fixes, in plain words, for the company page.
export function fixesFor(findings: Finding[]): string[] {
  const out = new Set<string>();
  for (const f of findings.filter((x) => x.hard)) {
    const p = f.problem.toLowerCase();
    if (p.includes("slow") || p.includes("heavy")) out.add("A light page that opens fast on phones");
    if (p.includes("whatsapp") || p.includes("contact") || p.includes("enquir") || p.includes("question")) out.add("Call and WhatsApp buttons on every screen");
    if (p.includes("breaks") || p.includes("layout")) out.add("Made for phone screens first");
    if (p.includes("secure")) out.add("Ready to run on HTTPS, so browsers don't warn visitors");
    if (p.includes("no website") || p.includes("doesn't open") || p.includes("for sale")) out.add("A simple website, ready to go live");
    if (p.includes("title") || p.includes("description") || p.includes("google")) out.add("A clear title and description for Google");
  }
  out.add("Your services, address and phone number up front");
  return [...out].slice(0, 4);
}

const digits = (s: string) => s.replace(/\D/g, "");

// An Indian mobile number (10 digits starting 6–9) as 91XXXXXXXXXX, else null.
export function whatsappNumber(phones: string[]): string | null {
  for (const p of phones) {
    let d = digits(p);
    if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
    else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
    if (d.length === 10 && /^[6-9]/.test(d)) return `91${d}`;
  }
  return null;
}

export async function makeFix(opts: { name: string; website: string | null; city: string | null; sector: string | null; contactPhones: string[]; contactEmail: string | null }): Promise<FixPage> {
  const pages = opts.website ? await cachedPagesFor(opts.website) : [];
  const text = pages.join("\n\n---\n\n").slice(0, 12000);
  const out = text
    ? await askJson<Omit<FixPage, "name" | "whatsapp">>(
        `You are rewriting the home page of a small business so it is short, clear and easy to use on a phone.
Use ONLY facts from the website text below. Never invent services, awards, numbers, prices, doctors or opening hours. If something isn't in the text, leave it out (empty list or null).

Business: ${opts.name}${opts.city ? `, ${opts.city}` : ""}${opts.sector ? ` (${opts.sector})` : ""}

Return:
- tagline: one plain sentence (at most 12 words) saying what they do and where.
- about: 2 or 3 short, plain sentences for a patient or customer. No marketing words like "state of the art" or "world class".
- services: up to 8 services or departments, short names, exactly as the site names them (tidied).
- highlights: up to 3 short facts worth seeing first, like "24/7 helpline" or "100 beds", only if the text says so.
- address: the address as written on the site, or null.
- hours: opening hours as written, or null.
- phones: phone numbers exactly as written on the site.
- email: the email address on the site, or null.

WEBSITE TEXT:
${text}`,
        schema,
        { temperature: 0.2 },
      )
    : { tagline: `${opts.sector ?? "Local business"} in ${opts.city ?? "your city"}`, about: "", services: [], highlights: [], address: null, hours: null, phones: [], email: null };

  // Keep only contact details that really appear in the site's text or our saved contacts.
  const known = digits(`${text} ${opts.contactPhones.join(" ")}`);
  const seen = new Set<string>();
  const phones = [...(out.phones ?? []), ...opts.contactPhones]
    .map((p) => p.trim())
    .filter((p) => {
      const d = digits(p);
      if (d.length < 8 || !known.includes(d.slice(-8)) || seen.has(d.slice(-10))) return false;
      seen.add(d.slice(-10)); // the same number written as 0932… and +91 932… counts once
      return true;
    })
    .slice(0, 3);
  const email = [out.email, opts.contactEmail].find((e) => e && text.toLowerCase().includes(e.toLowerCase())) ?? opts.contactEmail ?? null;
  return {
    name: opts.name,
    tagline: (out.tagline ?? "").trim(),
    about: (out.about ?? "").trim(),
    services: (out.services ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 8),
    highlights: (out.highlights ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 3),
    address: out.address?.trim() || null,
    hours: out.hours?.trim() || null,
    phones,
    email,
    whatsapp: whatsappNumber(phones),
  };
}

// The same, looking up the saved phone numbers and email for the company first.
export async function makeFixFor(companyId: string, company: { name: string; website: string | null; city: string | null; sector: string | null }): Promise<FixPage> {
  const { data: contacts } = await createAdminClient().from("contacts").select("email, phone").eq("company_id", companyId);
  return makeFix({
    ...company,
    contactPhones: (contacts ?? []).map((c) => c.phone).filter(Boolean) as string[],
    contactEmail: (contacts ?? []).find((c) => c.email)?.email ?? null,
  });
}

