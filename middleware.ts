import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession() reads the JWT from the cookie locally — no network call.
  // Page-level auth (getCurrentStaff) still calls getUser() for a verified check.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.startsWith("/auth/reset-password");
  const isPublicAsset = request.nextUrl.pathname.startsWith("/_next");

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  if (!user && !isPublicRoute && !isPublicAsset) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  // Redirect logged-in users away from /login, but NOT from /auth/reset-password
  // (they may have clicked a password-reset email while already logged in), and
  // NOT when /login carries an ?error (e.g. account_deactivated): a user whose
  // profile is missing/inactive still holds a valid session, so bouncing them to
  // /dashboard would loop forever and never surface the error. Letting them land
  // on /login lets the page show the message and clear the stuck session.
  if (
    user &&
    request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.searchParams.has("error")
  ) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};