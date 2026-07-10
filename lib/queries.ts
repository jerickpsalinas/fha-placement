import { createClient } from "@/lib/supabase/server";
import type {
  Student, TestScore, TranscriptEntry, SupportPlan, Accommodation,
  OnlineLearningRecord, GraduationRequirement, Schedule, ScheduleBlock,
  StudentEdgePathway,
} from "@/types";

/** List students visible to the current user (RLS handles scoping). */
export async function listStudents(): Promise<Student[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("active", true)
    .order("last_name", { ascending: true });

  if (error) throw error;
  return data as Student[];
}

export async function getStudent(id: string): Promise<Student | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
  if (error) return null;
  return data as Student;
}

export async function getTestScores(studentId: string): Promise<TestScore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("test_scores")
    .select("*")
    .eq("student_id", studentId)
    .order("test_date", { ascending: false });
  if (error) throw error;
  return data as TestScore[];
}

export async function getTranscript(studentId: string): Promise<TranscriptEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transcript_entries")
    .select("*")
    .eq("student_id", studentId)
    .order("school_year", { ascending: true });
  if (error) throw error;
  return data as TranscriptEntry[];
}

export async function getSupportPlans(studentId: string): Promise<(SupportPlan & { accommodations: Accommodation[] })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_plans")
    .select("*, accommodations(*)")
    .eq("student_id", studentId);
  if (error) throw error;
  return data as (SupportPlan & { accommodations: Accommodation[] })[];
}

export async function getOnlineLearningRecords(studentId: string): Promise<OnlineLearningRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("online_learning_records")
    .select("*")
    .eq("student_id", studentId)
    .order("school_year", { ascending: false });
  if (error) throw error;
  return data as OnlineLearningRecord[];
}

export async function getGraduationRequirements(schoolYear: string): Promise<GraduationRequirement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("graduation_requirements")
    .select("*")
    .eq("school_year", schoolYear);
  if (error) throw error;
  return data as GraduationRequirement[];
}

export async function getSchedules(studentId: string): Promise<Schedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Schedule[];
}

export async function getScheduleBlocks(scheduleId: string): Promise<ScheduleBlock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("schedule_id", scheduleId);
  if (error) throw error;
  return data as ScheduleBlock[];
}

export async function getEdgePathways(studentId: string): Promise<StudentEdgePathway[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_edge_pathways")
    .select("*")
    .eq("student_id", studentId);
  if (error) throw error;
  return data as StudentEdgePathway[];
}

/** Schedules awaiting admin approval, across all students (admin dashboard). */
export async function listPendingApprovals(): Promise<(Schedule & { students: Student })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("*, students(*)")
    .eq("status", "pending_approval")
    .order("updated_at", { ascending: true });
  if (error) throw error;
  return data as (Schedule & { students: Student })[];
}

/** Writes an audit log entry. Call this after any create/update/delete. */
export async function logAudit(params: {
  staffId: string;
  studentId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  details?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  await supabase.from("audit_log").insert({
    staff_id: params.staffId,
    student_id: params.studentId ?? null,
    action: params.action,
    table_name: params.tableName,
    record_id: params.recordId ?? null,
    details: params.details ?? {},
  });
}
