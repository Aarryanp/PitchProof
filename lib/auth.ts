import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Who is signed in, for pages. getClaims() checks the sign-in token on our own
// server instead of asking Supabase each time (getUser() is a round trip to
// Supabase on every call), and cache() makes all parts of one page share one
// check. This is what keeps switching screens fast.
export const getSessionUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});
