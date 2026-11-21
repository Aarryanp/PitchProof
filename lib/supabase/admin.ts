import { createClient } from "@supabase/supabase-js";

// Supabase with full access, for server code only (API routes, scripts).
// It skips row-level security, so never import this in a browser component.
// The secret key has no NEXT_PUBLIC_ prefix, so Next.js never sends it to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
