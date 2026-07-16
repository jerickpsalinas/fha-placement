import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Recovery tokens carry ?type=recovery — send user to set their password.
      // Invite tokens (type=invite or absent) go straight to /dashboard.
      const type = searchParams.get("type");
      const destination = type === "recovery" ? "/auth/reset-password" : "/dashboard";
      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
