import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The sign-in email link lands here. It swaps the one-time code for a
// sign-in cookie, then sends the student on to their Profile.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/pipeline`);
  }
  return NextResponse.redirect(`${origin}/sign-in?error=link`);
}
