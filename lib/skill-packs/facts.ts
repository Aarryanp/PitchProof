import type { PageRead } from "@/lib/olostep";
import type { SpeedResult } from "@/lib/pagespeed";

// Plain facts about one website, measured by tools (never by the model).
// Each skill pack turns some of these facts into problems with evidence.

export type SiteFacts = {
  url: string;
  opens: boolean | null; // null = we couldn't check
  openError: string | null;
  parked: boolean;
  https: boolean;
  performance: number | null;
  loadSeconds: number | null;
  pageMB: number | null;
  speedFixes: { fix: string; seconds: number }[];
  seo: number | null;
  hasViewport: boolean | null;
  hasTitle: boolean | null;
  hasDescription: boolean | null;
  pageRead: boolean; // we have the home page text
  hasPhone: boolean;
  hasWhatsApp: boolean;
  hasBooking: boolean; // a form, "book an appointment" or similar
  hasChat: boolean;
  copyrightYear: number | null;
  emails: string[];
  pageText: string; // first part of the home page, for Gemini and the email
};

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function emailsIn(text: string): string[] {
  const found = (text.match(EMAIL) ?? []).map((e) => e.toLowerCase().replace(/\.$/, ""));
  // Drop image names and placeholders that look like emails.
  return [...new Set(found)].filter((e) => !/\.(png|jpe?g|gif|webp|svg)$/.test(e) && !/example\.|sentry|wixpress|domain\.com/.test(e));
}

export function siteFacts(url: string, page: PageRead, speed: SpeedResult): SiteFacts {
  const md = page.status === "read" ? page.markdown : "";
  const lower = md.toLowerCase();
  const report = speed.status === "measured" ? speed.report : null;

  // Does it open? A failed read or a failed speed check both say no.
  let opens: boolean | null = null;
  let openError: string | null = null;
  if (page.status === "read" || report) opens = true;
  else if (page.status === "failed" || speed.status === "failed") {
    opens = false;
    openError = page.status === "failed" ? page.error : speed.status === "failed" ? speed.error : null;
  }

  // "For sale" and parking pages (GoDaddy, Sedo, Atom...). Their emails belong to the seller, not the business.
  const parked = /domains? (?:name )?(?:is )?for sale|buy this domain|this domain is parked|domain may be for sale|parkedpages|parkweb|sedoparking|domain marketplace/i.test(md);

  const years = [...md.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?((?:19|20)\d{2})/gi)].map((m) => Number(m[1]));

  return {
    url,
    opens,
    openError,
    parked,
    https: (report?.finalUrl ?? url).startsWith("https://"),
    performance: report?.performance ?? null,
    loadSeconds: report?.loadSeconds ?? null,
    pageMB: report?.pageMB ?? null,
    speedFixes: report?.topFixes ?? [],
    seo: report?.seo ?? null,
    hasViewport: report?.hasViewport ?? null,
    hasTitle: report?.hasTitle ?? null,
    hasDescription: report?.hasDescription ?? null,
    pageRead: md.length > 400,
    hasPhone: /tel:|(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|\b0\d{2,4}[\s-]?\d{6,8}\b/.test(md),
    hasWhatsApp: /wa\.me|whatsapp/i.test(md),
    hasBooking: /book (?:an )?appointment|request (?:an )?appointment|book now|book online|enquire now|enquiry form|contact form|send (?:us )?(?:a )?message|submit/i.test(lower),
    hasChat: /live chat|chat with us|tawk\.to|crisp\.chat|intercom|chatbot/i.test(md),
    copyrightYear: years.length ? Math.max(...years) : null,
    emails: parked ? [] : emailsIn(md),
    pageText: md.slice(0, 6000),
  };
}
