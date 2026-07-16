import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  console.log("[auth/callback] query params:", Object.fromEntries(searchParams.entries()));

  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    // Capture whether a session already exists before the code exchange.
    // A fresh code exchange (invite/recovery link) will have no prior session.
    const { data: existing } = await supabase.auth.getSession();
    const hadSession = !!existing.session;

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = searchParams.get("next");

      // If the user had no session before the exchange, this is a fresh
      // invite/recovery link — they need to set their password.
      const destination =
        !hadSession || next === "/auth/reset-password"
          ? "/auth/reset-password"
          : next ?? "/dashboard";

      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
