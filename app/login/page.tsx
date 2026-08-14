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
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError && urlError !== "auth") {
      setError(urlError);
    } else if (urlError === "auth") {
      setError("Authentication failed. Please try again or request a new link.");
    }
  }, [searchParams]);

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

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  }

  if (mode === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-navy">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8 border border-hairline">
          <p className="text-[10px] uppercase tracking-[.15em] text-gold font-bold mb-2">Father&apos;s Harbor Academy</p>
          <h1 className="text-xl font-bold text-navy mb-1 font-serif">Reset your password</h1>
          <p className="text-sm text-navy/50 mb-6">Enter your email and we&apos;ll send you a reset link.</p>

          {resetSent ? (
            <p className="text-sm text-onlevel">
              If an account exists for that email, a reset link has been sent. Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-navy mb-1" htmlFor="reset-email">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-hairline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              {error && <p className="text-sm text-intervention">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-gold rounded py-2 text-sm font-bold hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setResetSent(false); }}
            className="text-xs text-navy/40 mt-6 underline"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-semibold text-navy" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(null); }}
                className="text-[10px] text-navy/50 underline"
              >
                Forgot password?
              </button>
            </div>
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
