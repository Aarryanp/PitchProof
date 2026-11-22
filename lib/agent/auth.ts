import { createAdminClient } from "@/lib/supabase/admin";

// Who is calling an agent route. The phone app sends the student's Supabase
// sign-in token as "Authorization: Bearer <token>"; Supabase checks it.
export async function studentFromRequest(req: Request): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await createAdminClient().auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

// The phone app's web build runs on another address, so the browser asks
// first whether it may call us (CORS). These headers say yes.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

// Which server keys are missing, so the app can say what to set up.
export function missingKeys(): string[] {
  return ["SUPABASE_SECRET_KEY", "GEMINI_API_KEY", "PAGESPEED_API_KEY"].filter((k) => !process.env[k]);
}
