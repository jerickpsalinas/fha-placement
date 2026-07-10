"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/queries";
import { redirect } from "next/navigation";
import type { AcademicPathway } from "@/types";

export async function createDraftSchedule(studentId: string, schoolYear: string, pathways: AcademicPathway[]) {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin" && staff.role !== "counselor") {
    throw new Error("Not authorized to build schedules.");
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedules")
    .insert({
      student_id: studentId,
      school_year: schoolYear,
      pathways,
      status: "draft",
      generated_by: staff.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({ staffId: staff.id, studentId, action: "create", tableName: "schedules", recordId: data.id });

  redirect(`/students/${studentId}/schedule/${data.id}`);
}

export async function addScheduleBlock(scheduleId: string, studentId: string, formData: FormData) {
  const staff = await getCurrentStaff();
  const supabase = await createClient();

  const { error } = await supabase.from("schedule_blocks").insert({
    schedule_id: scheduleId,
    block_label: String(formData.get("block_label") ?? ""),
    course_name: String(formData.get("course_name") ?? ""),
    course_category: String(formData.get("course_category") ?? "core"),
    is_online: formData.get("is_online") === "on",
    notes: formData.get("notes") || null,
  });

  if (error) throw new Error(error.message);
  await logAudit({ staffId: staff.id, studentId, action: "update", tableName: "schedule_blocks", details: { scheduleId } });
  redirect(`/students/${studentId}/schedule/${scheduleId}`);
}

export async function submitForApproval(scheduleId: string, studentId: string) {
  const staff = await getCurrentStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("schedules")
    .update({ status: "pending_approval" })
    .eq("id", scheduleId);

  if (error) throw new Error(error.message);
  await logAudit({ staffId: staff.id, studentId, action: "submit_for_approval", tableName: "schedules", recordId: scheduleId });
  redirect(`/students/${studentId}/schedule/${scheduleId}`);
}

export async function approveSchedule(scheduleId: string, studentId: string, adminNotes: string) {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin") throw new Error("Only an administrator can approve a schedule.");
  const supabase = await createClient();

  const { error } = await supabase
    .from("schedules")
    .update({ status: "approved", admin_notes: adminNotes || null })
    .eq("id", scheduleId);

  if (error) throw new Error(error.message);
  await logAudit({ staffId: staff.id, studentId, action: "approve", tableName: "schedules", recordId: scheduleId });
  redirect(`/students/${studentId}/schedule/${scheduleId}`);
}

export async function rejectSchedule(scheduleId: string, studentId: string, reason: string) {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin") throw new Error("Only an administrator can reject a schedule.");
  const supabase = await createClient();

  const { error } = await supabase
    .from("schedules")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", scheduleId);

  if (error) throw new Error(error.message);
  await logAudit({ staffId: staff.id, studentId, action: "reject", tableName: "schedules", recordId: scheduleId, details: { reason } });
  redirect(`/students/${studentId}/schedule/${scheduleId}`);
}
