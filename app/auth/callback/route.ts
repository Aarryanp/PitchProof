import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The sign-in link (or Google) lands here. It swaps the one-time code for a
// sign-in cookie. New students go to onboarding; returning ones to their leads.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: student } = await supabase.from("students").select("id").eq("id", data.user.id).maybeSingle();
      return NextResponse.redirect(`${origin}${student ? "/pipeline" : "/onboarding"}`);
    }
  }
  return NextResponse.redirect(`${origin}/sign-in?error=link`);
}
