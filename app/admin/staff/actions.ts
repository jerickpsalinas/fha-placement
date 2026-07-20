"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { createClient as createAdminSupabaseClient } from "@supabase/supabase-js";
import type { StaffRole } from "@/types";

/**
 * Creates a new staff account: creates the user directly via Supabase Auth
 * admin API with an admin-set password (email pre-confirmed, no invite
 * email) and creates their staff_profiles row with the chosen role.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY — this key must NEVER be exposed to the
 * browser. It is only referenced here, in a server action.
 */
export async function createStaffMember(formData: FormData) {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin" && staff.role !== "director") {
    throw new Error("Only an administrator can add staff members.");
  }

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "read_only") as StaffRole;

  if (!email || !fullName) throw new Error("Name and email are required.");
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");

  const adminClient = createAdminSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Failed to create user.");
  }

  const supabase = await createServerClient();
  const { error: profileError } = await supabase.from("staff_profiles").insert({
    id: created.user.id,
    full_name: fullName,
    role,
    active: true,
  });

  if (profileError) throw new Error(profileError.message);
}

export async function deactivateStaffMember(staffId: string) {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin" && staff.role !== "director") throw new Error("Only an administrator can deactivate staff.");
  if (staffId === staff.id) throw new Error("You cannot deactivate your own account.");

  const supabase = await createServerClient();
  const { error } = await supabase.from("staff_profiles").update({ active: false }).eq("id", staffId);
  if (error) throw new Error(error.message);
}

export async function updateStaffRole(staffId: string, role: StaffRole) {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin" && staff.role !== "director") throw new Error("Only an administrator can change staff roles.");

  const supabase = await createServerClient();
  const { error } = await supabase.from("staff_profiles").update({ role }).eq("id", staffId);
  if (error) throw new Error(error.message);
}
