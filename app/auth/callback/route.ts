import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  console.log("[auth/callback] query params:", Object.fromEntries(searchParams.entries()));

  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const type = searchParams.get("type");
      const next = searchParams.get("next");
      const needsPasswordSet = type === "recovery" || type === "invite";

      let destination: string;
      if (needsPasswordSet) {
        destination = "/auth/reset-password";
      } else if (next) {
        destination = next;
      } else {
        destination = "/dashboard";
      }

      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
