import { corsHeaders, json, studentFromRequest } from "@/lib/agent/auth";
import { findForSearch } from "@/lib/agent/find";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/agent/search  (called by "Run the agent" in the phone app)
// Body: { skill, sector, city, count }
// Saves the search, picks businesses (step 1) and claims them.
// Returns { searchId, leads: [{ id, name, website }], note }.
// The app then calls /api/agent/company once per business.

export const maxDuration = 60;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  if (!process.env.SUPABASE_SECRET_KEY) return json({ error: "The server is missing its Supabase secret key." }, 503);
  const studentId = await studentFromRequest(req);
  if (!studentId) return json({ error: "Sign in to run a search." }, 401);

  const body = await req.json().catch(() => ({}));
  const skill = String(body.skill ?? "web");
  const sector = String(body.sector ?? "").trim();
  const city = String(body.city ?? "").trim();
  const count = Math.min(Math.max(Number(body.count) || 10, 1), 20);
  if (!sector || !city) return json({ error: "Pick a type of business and a city." }, 400);

  const db = createAdminClient();
  const { data: student } = await db.from("students").select("id").eq("id", studentId).maybeSingle();
  if (!student) return json({ error: "Save your profile first, so the agent knows what you offer." }, 400);

  const { data: search, error } = await db.from("searches").insert({ student_id: studentId, skill_type: skill, sector, city, count }).select("id").single();
  if (error || !search) return json({ error: "Couldn't save the search." }, 500);

  try {
    const { leads, note } = await findForSearch({ studentId, sector, city, count });
    return json({ searchId: search.id, leads, note });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Finding businesses failed." }, 502);
  }
}
