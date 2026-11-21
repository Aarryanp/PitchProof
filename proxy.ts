import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before each page loads. It keeps the Supabase sign-in cookie fresh,
// so a student stays signed in. (In Next.js 16 this file is called proxy.ts;
// older versions called it middleware.ts.)
export async function proxy(request: NextRequest) {
  // If Supabase sends the sign-in link to the wrong page (for example the
  // home page, when this address isn't in its allowed list), pass the code
  // on to the page that finishes signing in.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refreshes the session if it has expired.
  const { data } = await supabase.auth.getUser();

  // The home address opens the app for a signed-in student and the welcome
  // screen for everyone else.
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = data.user ? "/pipeline" : "/welcome";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Skip static files, images and the public company pages (they need no sign-in).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|p/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
