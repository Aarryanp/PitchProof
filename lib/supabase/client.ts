import { createBrowserClient } from "@supabase/ssr";

// Supabase for code that runs in the browser (for example, the sign-in form).
// It uses the public key, so row-level security decides what it can see.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
