import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { StaffProfile, StaffRole } from "@/types";

/**
 * Fetches the logged-in user's staff profile (role, name, active status).
 * Redirects to /login if there's no session.
 */
export async function getCurrentStaff(): Promise<StaffProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    redirect("/login");
  }

  if (!data.active) {
    redirect("/login?error=account_deactivated");
  }

  return data as StaffProfile;
}

/**
 * Use in server components/route handlers that should only be reachable by
 * specific roles. Throws a redirect to /dashboard with an error if the
 * current staff member's role isn't in `allowed`.
 */
export async function requireRole(allowed: StaffRole[]): Promise<StaffProfile> {
  const staff = await getCurrentStaff();
  if (!allowed.includes(staff.role)) {
    redirect("/dashboard?error=not_authorized");
  }
  return staff;
}
