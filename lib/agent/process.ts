import { cachedPagesFor } from "@/lib/agent/cache";
import { draftEmail } from "@/lib/agent/email";
import { qualityGate } from "@/lib/agent/gate";
import { askJson, hasGemini } from "@/lib/gemini";
import { readPage } from "@/lib/olostep";
import { measure } from "@/lib/pagespeed";
import { emailsIn, siteFacts } from "@/lib/skill-packs/facts";
import { packFor } from "@/lib/skill-packs";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Finding, Student } from "@/lib/types";

// Steps 2–8 for ONE business (one server call each, so no call runs too long):
// read the site, measure it, list problems for the student's skill, run the
// quality gate, find an email, and write a draft. Nothing is sent: the draft
// waits in "Needs approval" until the student presses Approve.

export type ProcessResult = {
  companyId: string;
  name: string;
  stage: "skipped" | "audited" | "needs_approval";
  topProblem: string | null;
  note: string;
};

export async function processCompany(opts: { studentId: string; searchId: string | null; companyId: string; skill: string }): Promise<ProcessResult> {
  const db = createAdminClient();
  const { studentId, companyId } = opts;

  const { data: company } = await db.from("companies").select("id, name, website, sector, city, claimed_by").eq("id", companyId).maybeSingle();
  if (!company || company.claimed_by !== studentId) throw new Error("This business isn't on your list.");
  const co = company; // the same row, kept for the draft step below
  const result = (stage: ProcessResult["stage"], note: string, top: Finding | null = null): ProcessResult => ({ companyId, name: company.name, stage, topProblem: top?.evidence ?? null, note });

  // Already done for this student? Don't redo it (and don't pay twice).
  const { data: existing } = await db.from("audits").select("id, findings, passed_gate, skip_reason").eq("company_id", companyId).eq("student_id", studentId).maybeSingle();
  if (existing) {
    const { data: pitch } = await db.from("pitches").select("id").eq("audit_id", existing.id).maybeSingle();
    const top = ((existing.findings as Finding[]) ?? []).find((f) => f.hard) ?? null;
    if (!existing.passed_gate) return result("skipped", existing.skip_reason ?? "Skipped", top);
    if (pitch) return result("needs_approval", "Already drafted.", top);
    // Audited earlier without a draft (for example no Gemini key then): try the draft again below.
    return await draft(existing.id, existing.findings as Finding[]);
  }

  const { data: studentRow } = await db.from("students").select("*").eq("id", studentId).maybeSingle();
  if (!studentRow) throw new Error("Save your profile first.");

  // Steps 2–3: read and measure. Both look in the cache first.
  if (!company.website) {
    const findings: Finding[] = [{ problem: "No website", evidence: "No website is listed for this business", source: "Crustdata", hard: true }];
    const { data: audit } = await db.from("audits").insert({ company_id: companyId, student_id: studentId, search_id: opts.searchId, skill_type: opts.skill, findings, passed_gate: true }).select("id").single();
    return await draft(audit!.id, findings);
  }
  const [page, speed] = await Promise.all([readPage(company.website), measure(company.website)]);
  const facts = siteFacts(company.website, page, speed);
  const checked = page.status !== "not_read" || speed.status !== "unavailable";
  if (!checked) {
    // Not saved as an audit, so it can be checked later once a tool is available.
    return result("audited", "Not checked yet: this site hasn't been read before, new reads are switched off, and PageSpeed has no key.");
  }
  await db.from("companies").update({ website_status: facts.parked ? "parked" : facts.opens === false ? "dead" : "live" }).eq("id", companyId);

  // Step 4: problems for this skill + the quality gate.
  const pack = packFor(opts.skill);
  const findings = pack.findings(facts);
  let gate = qualityGate(findings, { checked });

  // Clean-up: Crustdata labels some traders and clubs as clinics. Gemini reads
  // the page and says if this really is the kind of business searched for.
  if (gate.passed && hasGemini() && page.status === "read" && company.sector) {
    try {
      const v = await askJson<{ matches: boolean; reason: string }>(
        `Business name: ${company.name}\nSearched for: ${company.sector}\nHome page text (start):\n${facts.pageText.slice(0, 3000)}\n\nIs this business really a "${company.sector}" type of business that serves customers directly? Answer matches true or false, and a short reason (max 12 words).`,
        { type: "object", properties: { matches: { type: "boolean" }, reason: { type: "string" } }, required: ["matches", "reason"] },
        { temperature: 0 },
      );
      if (!v.matches) gate = { passed: false, reason: `Not a ${company.sector.toLowerCase()} business: ${v.reason}` };
    } catch {
      // If Gemini is down, keep going; the student still reviews every pitch.
    }
  }

  // Failed only because the speed check couldn't run? Don't save a "skip",
  // so the next search checks it again once PageSpeed works.
  if (!gate.passed && speed.status === "unavailable" && !gate.reason.startsWith("Not a "))
    return result("skipped", "No problem found yet, but the speed check couldn't run (PageSpeed key missing). It will be checked again next time.", findings[0] ?? null);

  const { data: audit } = await db
    .from("audits")
    .insert({ company_id: companyId, student_id: studentId, search_id: opts.searchId, skill_type: opts.skill, findings, passed_gate: gate.passed, skip_reason: gate.passed ? null : gate.reason })
    .select("id")
    .single();
  if (!gate.passed) return result("skipped", gate.reason, findings[0] ?? null);

  // Step 5: find the person. Saved contacts first, then emails on pages we already read.
  const { data: contacts } = await db.from("contacts").select("id, email").eq("company_id", companyId);
  if (!(contacts ?? []).some((c) => c.email)) {
    const pages = facts.parked ? [] : await cachedPagesFor(company.website);
    const emails = [...new Set([...facts.emails, ...pages.flatMap(emailsIn)])];
    if (emails.length) await db.from("contacts").insert({ company_id: companyId, email: emails[0], source: "website (Olostep)" });
  }
  return await draft(audit!.id, findings);

  // Steps 6–8: page link + email draft, saved as a pitch with status "draft".
  async function draft(auditId: string, list: Finding[]): Promise<ProcessResult> {
    const top = list.find((f) => f.hard) ?? null;
    const { data: contact } = await db.from("contacts").select("id, name, email, phone").eq("company_id", companyId).not("email", "is", null).order("created_at").limit(1).maybeSingle();
    if (!contact) {
      const { data: phone } = await db.from("contacts").select("phone").eq("company_id", companyId).not("phone", "is", null).limit(1).maybeSingle();
      return result("audited", phone?.phone ? `Real problem found, but no email. Phone: ${phone.phone}` : "Real problem found, but no email or phone yet.", top);
    }
    if (!hasGemini()) return result("audited", "Real problem found. The email draft needs the Gemini key.", top);

    const student = studentRow as Student;
    // Daily limit: at most this many new drafts a day (India time).
    const ist = 5.5 * 3600 * 1000;
    const nowIst = new Date(Date.now() + ist);
    const since = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - ist).toISOString();
    const { count } = await db.from("pitches").select("id", { count: "exact", head: true }).eq("student_id", studentId).gte("created_at", since);
    if ((count ?? 0) >= (student.daily_limit ?? 15)) return result("audited", `Daily limit of ${student.daily_limit ?? 15} new pitches reached. Run again tomorrow.`, top);

    const slug = `${co.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-${Math.random().toString(36).slice(2, 7)}`;
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://pitch-proof.vercel.app").replace(/\/$/, "");
    const mail = await draftEmail({ student, company: co, contactName: contact.name, findings: list, offer: packFor(opts.skill).offer, pageUrl: `${site}/p/${slug}` });
    await db.from("pitches").insert({
      audit_id: auditId,
      student_id: studentId,
      company_id: companyId,
      contact_id: contact.id,
      pitch_type: "audit",
      page_slug: slug,
      email_subject: mail.subject,
      email_body: mail.body,
      status: "draft",
    });
    return result("needs_approval", mail.passes ? "Email drafted. Review and approve it in Leads." : `Email drafted, but fix before approving: ${mail.problems.join("; ")}`, top);
  }
}
