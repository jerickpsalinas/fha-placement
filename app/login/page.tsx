"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (!urlError) return;

    const MESSAGES: Record<string, string> = {
      auth: "Authentication failed. Please try again or request a new link.",
      account_deactivated:
        "Your account has been deactivated. Contact your administrator for access.",
      not_authorized: "You don't have permission to view that page.",
    };
    setError(MESSAGES[urlError] ?? "Something went wrong. Please sign in again.");

    // A deactivated/profile-less user still holds a valid session, which would
    // otherwise keep bouncing them back here. Clear it so the next sign-in is clean.
    if (urlError === "account_deactivated") {
      supabase.auth.signOut();
    }
  }, [searchParams, supabase]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-navy">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8 border border-hairline">
        <p className="text-[10px] uppercase tracking-[.15em] text-gold font-bold mb-2">Father&apos;s Harbor Academy</p>
        <h1 className="text-xl font-bold text-navy mb-1 font-serif">Staff Placement &amp; Schedule Builder</h1>
        <p className="text-sm text-navy/50 mb-6">Sign in to continue</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-navy mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-hairline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-navy mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-hairline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {error && <p className="text-sm text-intervention">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-gold rounded py-2 text-sm font-bold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-navy/40 mt-6">
          Staff accounts are created by an administrator. Contact your admin if you need access.
        </p>
      </div>
    </div>
  );
}
