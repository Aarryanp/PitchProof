import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase for server code acting as the signed-in student.
// It reads the sign-in cookie, so row-level security still applies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server components can't set cookies. Safe to ignore here;
            // the sign-in session is refreshed elsewhere.
          }
        },
      },
    },
  );
}
