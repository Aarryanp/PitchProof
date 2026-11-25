import { corsHeaders, json, missingKeys } from "@/lib/agent/auth";
import { crustdataLive, olostepLive } from "@/lib/agent/settings";

// GET /api/agent/status: which keys and switches are set (names only, never values).
export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function GET() {
  return json({ missingKeys: missingKeys(), crustdataLive: crustdataLive(), olostepLive: olostepLive() });
}
