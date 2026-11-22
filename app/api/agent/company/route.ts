import { corsHeaders, json, studentFromRequest } from "@/lib/agent/auth";
import { processCompany } from "@/lib/agent/process";

// POST /api/agent/company
// Body: { searchId, companyId, skill }
// Runs steps 2–8 for one business: read and measure the site, quality gate,
// find an email, draft the pitch. Returns what happened, for the Search screen.

export const maxDuration = 180; // PageSpeed can take up to a minute and a half

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  if (!process.env.SUPABASE_SECRET_KEY) return json({ error: "The server is missing its Supabase secret key." }, 503);
  const studentId = await studentFromRequest(req);
  if (!studentId) return json({ error: "Sign in first." }, 401);
  const body = await req.json().catch(() => ({}));
  if (!body.companyId) return json({ error: "Which business?" }, 400);
  try {
    const result = await processCompany({ studentId, searchId: body.searchId ?? null, companyId: String(body.companyId), skill: String(body.skill ?? "web") });
    return json(result);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Checking this business failed." }, 500);
  }
}
