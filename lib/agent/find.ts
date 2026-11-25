import { urlKey } from "@/lib/agent/cache";
import { businessTypeFor } from "@/lib/business-types";
import { findCompanies } from "@/lib/crustdata";
import { createAdminClient } from "@/lib/supabase/admin";
import { crustdataLive } from "@/lib/agent/settings";

// Step 1: pick businesses for one search and claim them for this student.
// 1. Reuse businesses already saved in Supabase (free) that nobody claimed.
// 2. Only if that's not enough and CRUSTDATA_LIVE=on, ask Crustdata for more.
// 3. Claim them, so no other student pitches the same business.

export type FoundLead = { id: string; name: string; website: string | null };

export async function findForSearch(opts: { studentId: string; sector: string; city: string; count: number }): Promise<{ leads: FoundLead[]; note: string }> {
  const db = createAdminClient();
  const { studentId, sector, city, count } = opts;

  // Leave out businesses that are finished for this student: skipped by the
  // quality gate, or already drafted. Ones that passed but have no draft yet
  // (no email found, or the draft failed) are picked again, so the next search
  // can finish them. Their saved checks are reused, so this costs nothing.
  const [{ data: audited }, { data: pitched }] = await Promise.all([
    db.from("audits").select("company_id, passed_gate").eq("student_id", studentId),
    db.from("pitches").select("company_id").eq("student_id", studentId),
  ]);
  const done = new Set([
    ...(audited ?? []).filter((a) => !a.passed_gate).map((a) => a.company_id as string),
    ...(pitched ?? []).map((p) => p.company_id as string),
  ]);
  const { data: saved } = await db
    .from("companies")
    .select("id, name, website, claimed_by")
    .eq("sector", sector)
    .ilike("city", city)
    .or(`claimed_by.is.null,claimed_by.eq.${studentId}`)
    .order("created_at");
  // Never-checked businesses first, then ones waiting for a draft.
  const checked = new Set((audited ?? []).map((a) => a.company_id as string));
  let pool = (saved ?? []).filter((c) => !done.has(c.id)).sort((a, b) => Number(checked.has(a.id)) - Number(checked.has(b.id)));

  let crustNote = "";
  if (pool.length < count) {
    const type = businessTypeFor(sector);
    if (!type) crustNote = " Typed-in business types can't be searched on Crustdata yet.";
    else if (!crustdataLive()) crustNote = " Looking up new businesses on Crustdata is switched off, so only saved ones were used.";
    else {
      const { companies } = await findCompanies(type, city, count - pool.length);
      // Skip businesses already in the database under the same website.
      const { data: all } = await db.from("companies").select("website");
      const known = new Set((all ?? []).map((c) => (c.website ? urlKey(c.website) : "")));
      const fresh = companies.filter((c) => c.website && !known.has(urlKey(c.website)));
      if (fresh.length) {
        const { data: inserted } = await db
          .from("companies")
          .insert(fresh.map((c) => ({ name: c.name, website: c.website, sector, city, size: c.size, crustdata_id: c.crustdataId })))
          .select("id, name, website, claimed_by");
        pool = pool.concat(inserted ?? []);
      }
      crustNote = ` Crustdata found ${fresh.length} new.`;
    }
  }

  const pick = pool.slice(0, count);
  const unclaimed = pick.filter((c) => !c.claimed_by).map((c) => c.id);
  let claimedNow = new Set<string>();
  if (unclaimed.length) {
    // "claimed_by is null" in the update itself, so two students can't claim the same one.
    const { data } = await db.from("companies").update({ claimed_by: studentId }).in("id", unclaimed).is("claimed_by", null).select("id");
    claimedNow = new Set((data ?? []).map((c) => c.id as string));
  }
  const leads = pick.filter((c) => c.claimed_by === studentId || claimedNow.has(c.id)).map((c) => ({ id: c.id, name: c.name, website: c.website }));
  const note = `${leads.length} ${leads.length === 1 ? "business" : "businesses"} to check.${crustNote}`;
  return { leads, note };
}
