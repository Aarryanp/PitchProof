import type { FixPage } from "@/lib/agent/fix";

// Sample data so every screen can be seen before the agent steps exist.
// The businesses are made up on purpose (".example" websites), so no real
// business is shown next to numbers we did not measure.
// Screens label this data as "Sample data". Delete this file once the agent
// steps fill Supabase.

import type { CompanyPageData, LeadCard, PitchDetail, PortfolioItem, Student } from "./types";

export const sampleStudent: Student = {
  id: "sample",
  name: "Aarryan",
  bio: "CS student in Nagpur. I build fast, simple websites for small businesses.",
  photo_url: null,
  year_or_grad: "3rd year",
  goal: "freelance",
  skill_types: ["web", "design"],
  city: "Nagpur",
  voice_samples: [
    "Hey, saw your message. I can take a look tonight and send you something by tomorrow.",
    "Thanks for the chat today. I've put the changes we talked about in the link below.",
  ],
  daily_limit: 15,
};

export const samplePortfolio: PortfolioItem[] = [
  { id: "p1", title: "Bakery website", skill_tag: "web", image_url: null, link: null, one_line: "Menu and WhatsApp ordering for a local bakery, loads in under 2 seconds." },
  { id: "p2", title: "Coaching class landing page", skill_tag: "web", image_url: null, link: null, one_line: "One-page site with a batch enquiry form." },
  { id: "p3", title: "Clinic logo refresh", skill_tag: "design", image_url: null, link: null, one_line: "New logo and colours for a small dental clinic." },
];

export const sampleLeads: LeadCard[] = [
  { key: "s1", companyName: "Sunrise Dental Care", sector: "Dental clinic", city: "Nagpur", website: "sunrisedental.example", stage: "needs_approval", pitchId: "sample-1", topProblem: "Takes 9.1 s to open on a phone", skipReason: null },
  { key: "s2", companyName: "Green Leaf Physiotherapy", sector: "Physiotherapy", city: "Nagpur", website: "greenleafphysio.example", stage: "needs_approval", pitchId: "sample-2", topProblem: "No HTTPS, browsers show “Not secure”", skipReason: null },
  { key: "s3", companyName: "City Skin Clinic", sector: "Dermatology", city: "Nagpur", website: "cityskin.example", stage: "sent", pitchId: "sample-3", topProblem: "No phone or WhatsApp link", skipReason: null },
  { key: "s4", companyName: "Shree Eye Hospital", sector: "Eye hospital", city: "Nagpur", website: "shreeeye.example", stage: "opened", pitchId: "sample-4", topProblem: "Mobile score 31/100", skipReason: null },
  { key: "s5", companyName: "Little Steps Child Clinic", sector: "Paediatrics", city: "Nagpur", website: "littlesteps.example", stage: "replied", pitchId: "sample-5", topProblem: "Copyright says 2019", skipReason: null },
  { key: "s6", companyName: "Care Plus Diagnostics", sector: "Diagnostics", city: "Nagpur", website: "careplus.example", stage: "found", pitchId: null, topProblem: null, skipReason: null },
  { key: "s7", companyName: "Orange City Ortho Centre", sector: "Orthopaedics", city: "Nagpur", website: "orangecityortho.example", stage: "found", pitchId: null, topProblem: null, skipReason: null },
  { key: "s8", companyName: "Healwell Homeopathy", sector: "Homeopathy", city: "Nagpur", website: "healwell.example", stage: "audited", pitchId: null, topProblem: "Fails the mobile-friendly check", skipReason: null },
  { key: "s9", companyName: "Metro Heart Institute", sector: "Cardiology", city: "Nagpur", website: "metroheart.example", stage: "skipped", pitchId: null, topProblem: null, skipReason: "Site is fast and secure; no hard-evidence problem" },
  { key: "s10", companyName: "Lotus Women's Clinic", sector: "Gynaecology", city: "Nagpur", website: "lotusclinic.example", stage: "skipped", pitchId: null, topProblem: null, skipReason: "No contact email found" },
];

const sampleBody = `Hi Dr. Kale,

I'm Aarryan, a CS student in Nagpur. Your clinic's website takes about 9 seconds to open on a phone, and there's no WhatsApp button for booking.

I made a faster version so you can see the difference: https://pitchproof.example/p/sunrise-dental-care

If it's useful, I'd be happy to finish it properly. Could we talk for 10 minutes this week? If not, just reply "no" and I won't write again.

Aarryan`;

const samplePitchBase: PitchDetail = {
  id: "sample-1",
  status: "draft",
  pitchType: "audit",
  pageSlug: "sample",
  fixUrl: null,
  emailSubject: "your clinic's website on phones",
  emailBody: sampleBody,
  personalLine: "",
  company: { name: "Sunrise Dental Care", website: "sunrisedental.example", sector: "Dental clinic", city: "Nagpur" },
  contact: { name: "Dr. Meera Kale", role: "Founder", email: "hello@sunrisedental.example", source: "Contact page" },
  findings: [
    { problem: "Slow on mobile", evidence: "Mobile performance score 28/100; page takes 9.1 s to load", source: "PageSpeed Insights", hard: true },
    { problem: "Hard to contact", evidence: "No contact form, phone link or WhatsApp link on the home page", source: "Website read", hard: true },
    { problem: "Dated look", evidence: "Small grey text on a busy photo background; menu has 11 items", source: "Screenshot review", hard: false },
  ],
};

export function getSamplePitch(id: string): PitchDetail | null {
  const lead = sampleLeads.find((l) => l.pitchId === id);
  if (!lead) return null;
  if (id === "sample-1") return samplePitchBase;
  const status = lead.stage === "needs_approval" ? "draft" : lead.stage === "opened" ? "opened" : lead.stage === "replied" ? "replied" : "sent";
  return {
    ...samplePitchBase,
    id,
    status,
    company: { name: lead.companyName, website: lead.website, sector: lead.sector, city: lead.city },
    contact: { name: null, role: null, email: `hello@${lead.website}`, source: "Contact page" },
    findings: [{ problem: lead.topProblem ?? "", evidence: lead.topProblem ?? "", source: "PageSpeed Insights", hard: true }],
    emailBody: sampleBody.replace("Dr. Kale", "there"),
  };
}

export const sampleCompanyPage: CompanyPageData = {
  slug: "sample",
  student: {
    name: sampleStudent.name,
    city: sampleStudent.city,
    bio: sampleStudent.bio,
    photoUrl: null,
    email: "student@example.com",
    phone: null,
  },
  company: { name: "Sunrise Dental Care", city: "Nagpur" },
  findings: samplePitchBase.findings.filter((f) => f.hard),
  fixes: ["A light page that opens fast on phones", "Call and WhatsApp buttons on every screen", "Your services, address and phone number up front"],
  previewUrl: "/p/sample/preview",
  projects: samplePortfolio.map((p) => ({ title: p.title, oneLine: p.one_line, link: p.link, skillTag: p.skill_tag })),
};

export const sampleResults = {
  sent: 24,
  opened: 11,
  replied: 4,
  positive: 2,
  audit: { sent: 12, replied: 3 },
  generic: { sent: 12, replied: 1 },
  skillGaps: [
    { skill: "SEO basics", count: 4 },
    { skill: "Online booking setup", count: 2 },
  ],
};

// The made-up dental clinic's new home page, for /p/sample/preview.
export const sampleFixPage: FixPage = {
  name: "Sunrise Dental Care",
  tagline: "Family dental clinic in Dharampeth, Nagpur.",
  about: "Sunrise Dental Care looks after children and adults, from check-ups and cleaning to braces and implants. Walk in or book a time that suits you.",
  services: ["Check-ups and cleaning", "Fillings", "Root canal treatment", "Braces", "Implants", "Teeth whitening"],
  highlights: ["Open 6 days a week", "Children welcome"],
  address: "12 Example Road, Dharampeth, Nagpur",
  hours: "Mon to Sat, 10 am to 8 pm",
  phones: ["+91 90000 00000"],
  email: "hello@sunrisedental.example",
  whatsapp: null,
};

