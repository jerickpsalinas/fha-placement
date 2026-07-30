"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm border border-hairline">
        <p className="text-[10px] uppercase tracking-[.15em] text-gold font-bold mb-2">Father&apos;s Harbor Academy</p>
        <h1 className="text-xl font-bold text-navy mb-6 font-serif">Set new password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-navy mb-1">
              New password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-navy mb-1">
              Confirm password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          {error && <p className="text-sm text-intervention">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-gold rounded px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Set password"}
          </button>
        </form>
      </div>
    </div>
  );
}
