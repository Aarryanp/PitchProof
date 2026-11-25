import { corsHeaders, json, studentFromRequest } from "@/lib/agent/auth";
import { draftEmail, isTone } from "@/lib/agent/email";
import { hasGemini } from "@/lib/gemini";
import { offerFor, packsFor, parseSkills } from "@/lib/skill-packs";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Finding, Student } from "@/lib/types";

// POST /api/agent/redraft
// Body: { pitchId, tone: "friendly" | "formal" | "short" }
// Writes a fresh version of a draft email in the chosen tone, using the same
// facts and link as before. It only returns the new text: nothing is saved
// until the student presses "Use this" and then Save or Approve.

export const maxDuration = 60;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  if (!process.env.SUPABASE_SECRET_KEY) return json({ error: "The server is missing its Supabase secret key." }, 503);
  if (!hasGemini()) return json({ error: "The server is missing its Gemini key." }, 503);
  const studentId = await studentFromRequest(req);
  if (!studentId) return json({ error: "Sign in first." }, 401);
  const body = await req.json().catch(() => ({}));
  if (!body.pitchId) return json({ error: "Which pitch?" }, 400);
  if (!isTone(body.tone)) return json({ error: "Pick a tone: friendly, formal or short." }, 400);

  const db = createAdminClient();
  const { data: pitch } = await db
    .from("pitches")
    .select("id, status, page_slug, student_id, audits(findings, skill_type), companies(name, city, sector), contacts(name)")
    .eq("id", String(body.pitchId))
    .maybeSingle();
  if (!pitch || pitch.student_id !== studentId) return json({ error: "This pitch isn't yours." }, 404);
  if (pitch.status !== "draft") return json({ error: "This email is already approved, so it can't be rewritten." }, 409);
  const { data: student } = await db.from("students").select("*").eq("id", studentId).maybeSingle();
  if (!student) return json({ error: "Save your profile first." }, 400);

  // Supabase returns a joined row as an object (or a one-item list).
  const one = <T,>(x: unknown): T | null => ((Array.isArray(x) ? x[0] : x) as T | null) ?? null;
  const audit = one<{ findings: Finding[]; skill_type: string }>(pitch.audits);
  const company = one<{ name: string; city: string | null; sector: string | null }>(pitch.companies);
  const contact = one<{ name: string | null }>(pitch.contacts);
  if (!audit || !company) return json({ error: "This pitch is missing its audit." }, 500);

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://pitch-proof.vercel.app").replace(/\/$/, "");
  try {
    const mail = await draftEmail({
      student: student as Student,
      company,
      contactName: contact?.name ?? null,
      findings: audit.findings ?? [],
      offer: offerFor(packsFor(parseSkills(audit.skill_type))),
      pageUrl: `${site}/p/${pitch.page_slug}`,
      tone: body.tone,
    });
    return json(mail);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Couldn't write a new version." }, 500);
  }
}
