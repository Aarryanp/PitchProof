// Reads data for the screens. Runs on the server only.
// Each function returns real rows from Supabase when there are some, and
// falls back to sample data (lib/sample-data.ts) otherwise, with
// `sample: true` so the screen can say so.

import { cache } from "react";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSamplePitch,
  sampleCompanyPage,
  sampleLeads,
  samplePortfolio,
  sampleResults,
  sampleStudent,
} from "@/lib/sample-data";
import type {
  CompanyPageData,
  Finding,
  LeadCard,
  PitchDetail,
  PitchStatus,
  PortfolioItem,
  Stage,
  Student,
} from "@/lib/types";

export type Viewer = { userId: string; email: string | null; student: Student | null };

// Who is signed in, and their student row if they've saved a profile.
// cache(): the page and the layout share one lookup per request.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("*").eq("id", user.id).maybeSingle();
  return { userId: user.id, email: user.email, student: (student as Student) ?? null };
});

export async function getProfile(): Promise<{
  viewer: Viewer | null;
  student: Student;
  portfolio: PortfolioItem[];
  sample: boolean;
}> {
  const viewer = await getViewer();
  if (!viewer) return { viewer, student: sampleStudent, portfolio: samplePortfolio, sample: true };
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id, title, skill_tag, image_url, link, one_line")
    .eq("student_id", viewer.userId)
    .order("created_at");
  const empty: Student = {
    id: viewer.userId,
    name: "",
    bio: null,
    photo_url: null,
    year_or_grad: null,
    goal: null,
    skill_types: [],
    city: null,
    voice_samples: [],
    daily_limit: 15,
  };
  return { viewer, student: viewer.student ?? empty, portfolio: (items as PortfolioItem[]) ?? [], sample: false };
}

function stageFor(status: PitchStatus): Stage {
  if (status === "draft" || status === "approved") return "needs_approval";
  if (status === "skipped" || status === "declined") return "skipped";
  return status;
}

type AuditRow = { id: string; company_id: string; findings: Finding[]; passed_gate: boolean; skip_reason: string | null };
type PitchRow = { id: string; company_id: string; status: PitchStatus };
type CompanyRow = { id: string; name: string; sector: string | null; city: string | null; website: string | null };

export async function getLeads(): Promise<{ leads: LeadCard[]; sample: boolean; signedIn: boolean; hasProfile: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { leads: sampleLeads, sample: true, signedIn: false, hasProfile: false };
  const hasProfile = Boolean(viewer.student);

  const supabase = await createClient();
  const [{ data: companies }, { data: audits }, { data: pitches }] = await Promise.all([
    supabase.from("companies").select("id, name, sector, city, website").eq("claimed_by", viewer.userId),
    supabase.from("audits").select("id, company_id, findings, passed_gate, skip_reason").eq("student_id", viewer.userId),
    supabase.from("pitches").select("id, company_id, status").eq("student_id", viewer.userId),
  ]);

  const rows = (companies as CompanyRow[]) ?? [];
  if (rows.length === 0) return { leads: sampleLeads, sample: true, signedIn: true, hasProfile };

  const leads = rows.map((c): LeadCard => {
    const audit = (audits as AuditRow[] | null)?.find((a) => a.company_id === c.id);
    const pitch = (pitches as PitchRow[] | null)?.find((p) => p.company_id === c.id);
    const firstHard = audit?.findings?.find((f) => f.hard) ?? audit?.findings?.[0];
    let stage: Stage = "found";
    if (pitch) stage = stageFor(pitch.status);
    else if (audit && !audit.passed_gate) stage = "skipped";
    else if (audit) stage = "audited";
    return {
      key: c.id,
      companyName: c.name,
      sector: c.sector,
      city: c.city,
      website: c.website,
      stage,
      pitchId: pitch?.id ?? null,
      topProblem: firstHard?.evidence ?? null,
      skipReason: audit?.skip_reason ?? (pitch?.status === "declined" ? "Said no" : null),
    };
  });
  return { leads, sample: false, signedIn: true, hasProfile };
}

export async function getPitch(id: string): Promise<{ pitch: PitchDetail | null; sample: boolean }> {
  if (id.startsWith("sample-")) return { pitch: getSamplePitch(id), sample: true };
  const supabase = await createClient();
  const { data } = await supabase
    .from("pitches")
    .select(
      "id, status, pitch_type, page_slug, fix_url, email_subject, email_body, personal_line, companies(name, website, sector, city), contacts(name, role, email, source), audits(findings)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return { pitch: null, sample: false };
  // Supabase returns linked rows as objects here (each pitch has one of each).
  const row = data as unknown as {
    id: string;
    status: PitchStatus;
    pitch_type: "audit" | "generic";
    page_slug: string | null;
    fix_url: string | null;
    email_subject: string | null;
    email_body: string | null;
    personal_line: string | null;
    companies: PitchDetail["company"];
    contacts: PitchDetail["contact"];
    audits: { findings: Finding[] } | null;
  };
  return {
    sample: false,
    pitch: {
      id: row.id,
      status: row.status,
      pitchType: row.pitch_type,
      pageSlug: row.page_slug,
      fixUrl: row.fix_url,
      emailSubject: row.email_subject ?? "",
      emailBody: row.email_body ?? "",
      personalLine: row.personal_line ?? "",
      company: row.companies,
      contact: row.contacts,
      findings: row.audits?.findings ?? [],
    },
  };
}

export async function getResults(): Promise<{ results: typeof sampleResults; sample: boolean }> {
  const viewer = await getViewer();
  if (!viewer) return { results: sampleResults, sample: true };
  const supabase = await createClient();
  const [{ data: pitches }, { data: views }, { data: replies }, { data: gaps }] = await Promise.all([
    supabase.from("pitches").select("id, status, pitch_type").eq("student_id", viewer.userId),
    supabase.from("page_views").select("pitch_id"),
    supabase.from("messages").select("pitch_id, reply_label").eq("kind", "reply"),
    supabase.from("skill_gaps").select("missing_skill, company_count").eq("student_id", viewer.userId),
  ]);
  const sent = (pitches ?? []).filter((p) => ["sent", "opened", "replied", "declined"].includes(p.status));
  if (sent.length === 0) return { results: sampleResults, sample: true };
  const repliedIds = new Set((replies ?? []).map((r) => r.pitch_id));
  const byType = (t: string) => {
    const s = sent.filter((p) => p.pitch_type === t);
    return { sent: s.length, replied: s.filter((p) => repliedIds.has(p.id)).length };
  };
  return {
    sample: false,
    results: {
      sent: sent.length,
      opened: new Set((views ?? []).map((v) => v.pitch_id)).size,
      replied: repliedIds.size,
      positive: (replies ?? []).filter((r) => r.reply_label === "positive").length,
      audit: byType("audit"),
      generic: byType("generic"),
      skillGaps: (gaps ?? []).map((g) => ({ skill: g.missing_skill, count: g.company_count })),
    },
  };
}

// The public company page. Companies don't sign in, so this reads with the
// server-only secret key and returns only what the page shows.
export async function getCompanyPage(slug: string): Promise<CompanyPageData | null> {
  if (slug === "sample") return sampleCompanyPage;
  if (!process.env.SUPABASE_SECRET_KEY) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("pitches")
    .select("id, status, student_id, companies(name, city), audits(findings), students(name, city, bio, photo_url)")
    .eq("page_slug", slug)
    .neq("status", "declined")
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    student_id: string;
    companies: { name: string; city: string | null };
    audits: { findings: Finding[] } | null;
    students: { name: string; city: string | null; bio: string | null; photo_url: string | null };
  };
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("title, one_line, link, skill_tag")
    .eq("student_id", row.student_id)
    .limit(3);
  // Count the visit (blueprint step 10 uses this to decide follow-ups).
  await supabase.from("page_views").insert({ pitch_id: row.id });
  return {
    slug,
    student: { name: row.students.name, city: row.students.city, bio: row.students.bio, photoUrl: row.students.photo_url, email: null, phone: null },
    company: row.companies,
    findings: (row.audits?.findings ?? []).filter((f) => f.hard),
    before: { label: "Your site today", value: "—" },
    after: { label: "The version I made", value: "—" },
    projects: (items ?? []).map((i) => ({ title: i.title, oneLine: i.one_line, link: i.link, skillTag: i.skill_tag })),
  };
}
