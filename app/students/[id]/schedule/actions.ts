"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import {
  logAudit, getStudent, getTranscript, getOnlineLearningRecords,
  getGraduationRequirements, getSupportPlans,
} from "@/lib/queries";
import { runGraduationAudit } from "@/lib/audit/graduation";
import { recommendEdgePathways } from "@/lib/recommendations/edge";
import { generateDraftSchedule } from "@/lib/scheduling/generate";
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

/**
 * Auto-generates a DRAFT schedule from the student's graduation gaps, pathway
 * rules, accommodations, and EDGE recommendations, persists it with its course
 * blocks, and hands off to the normal review/approval flow. The counselor can
 * freely edit the result before submitting — this only seeds the draft.
 */
export async function generateAndCreateSchedule(studentId: string, schoolYear: string) {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin" && staff.role !== "counselor") {
    throw new Error("Not authorized to build schedules.");
  }

  const student = await getStudent(studentId);
  if (!student) throw new Error("Student not found.");

  const [transcript, onlineRecords, requirements, supportPlans] = await Promise.all([
    getTranscript(studentId),
    getOnlineLearningRecords(studentId),
    getGraduationRequirements(schoolYear),
    getSupportPlans(studentId),
  ]);

  const audit = runGraduationAudit(transcript, requirements, onlineRecords, schoolYear, student.gpa);
  const edgeRecs = recommendEdgePathways(student);
  const schedulingAccommodations = supportPlans.flatMap((sp) =>
    sp.accommodations.filter((a) => a.affects_scheduling).map((a) => ({ description: a.description }))
  );

  const generated = generateDraftSchedule(student, audit, schedulingAccommodations, edgeRecs);

  const supabase = await createClient();
  const { data: schedule, error: scheduleError } = await supabase
    .from("schedules")
    .insert({
      student_id: studentId,
      school_year: schoolYear,
      pathways: generated.pathways,
      status: "draft",
      generated_by: staff.id,
      admin_notes: generated.rationale.length
        ? `Auto-generated draft. Rationale:\n- ${generated.rationale.join("\n- ")}`
        : null,
    })
    .select("id")
    .single();

  if (scheduleError) throw new Error(scheduleError.message);

  if (generated.blocks.length > 0) {
    const { error: blocksError } = await supabase.from("schedule_blocks").insert(
      generated.blocks.map((b) => ({ ...b, schedule_id: schedule.id }))
    );
    if (blocksError) throw new Error(blocksError.message);
  }

  await logAudit({
    staffId: staff.id,
    studentId,
    action: "generate",
    tableName: "schedules",
    recordId: schedule.id,
    details: { auto: true, blocks: generated.blocks.length, pathways: generated.pathways },
  });

  redirect(`/students/${studentId}/schedule/${schedule.id}`);
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
