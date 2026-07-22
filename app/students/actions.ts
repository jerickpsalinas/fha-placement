"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/queries";
import { redirect } from "next/navigation";

export async function createStudent(formData: FormData) {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin" && staff.role !== "counselor") {
    throw new Error("Not authorized to add students.");
  }

  const supabase = await createClient();

  const payload = {
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    date_of_birth: formData.get("date_of_birth") || null,
    grade_level: String(formData.get("grade_level")),
    enrollment_type: String(formData.get("enrollment_type")),
    prior_school: formData.get("prior_school") || null,
    gpa: formData.get("gpa") ? Number(formData.get("gpa")) : null,
    credits_earned: formData.get("credits_earned") ? Number(formData.get("credits_earned")) : 0,
    has_iep: formData.get("has_iep") === "on",
    has_504: formData.get("has_504") === "on",
    dual_enrollment_active: formData.get("dual_enrollment_active") === "on",
    career_goals: formData.get("career_goals") || null,
    college_goals: formData.get("college_goals") || null,
    edge_interests: formData.getAll("edge_interests").map(String).filter(Boolean),
  };

  if (!payload.first_name || !payload.last_name) {
    throw new Error("First and last name are required.");
  }

  const { data, error } = await supabase.from("students").insert(payload).select().single();

  if (error) {
    throw new Error(error.message);
  }

  // If creator is a counselor, auto-assign themself to the student they just
  // created so they retain visibility under RLS (admins see everyone already).
  if (staff.role === "counselor") {
    await supabase.from("staff_student_assignments").insert({
      staff_id: staff.id,
      student_id: data.id,
    });
  }

  await logAudit({
    staffId: staff.id,
    studentId: data.id,
    action: "create",
    tableName: "students",
    recordId: data.id,
    details: { first_name: payload.first_name, last_name: payload.last_name },
  });

  redirect(`/students/${data.id}`);
}
