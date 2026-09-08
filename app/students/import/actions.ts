"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/queries";
import { SUBJECT_AREAS } from "@/lib/parsing/transcript";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const VALID_TEST_TYPES = new Set(["MAP", "FAST", "IXL", "ACT", "SAT"]);
const VALID_GRADES = new Set(["K","1","2","3","4","5","6","7","8","9","10","11","12"]);
const IMPORT_ROLES = new Set(["admin", "director", "counselor"]);
const CANONICAL_SUBJECT_AREAS = new Set<string>(SUBJECT_AREAS);

interface StudentMatch {
  id: string | null;
  ambiguous: boolean;
}

async function findStudentMatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  firstName: string,
  lastName: string
): Promise<StudentMatch> {
  const { data } = await supabase
    .from("students")
    .select("id")
    .ilike("first_name", firstName.trim())
    .ilike("last_name", lastName.trim())
    .limit(2);
  if (!data || data.length === 0) return { id: null, ambiguous: false };
  // More than one student shares this name — refuse to guess which one.
  if (data.length > 1) return { id: null, ambiguous: true };
  return { id: data[0].id as string, ambiguous: false };
}

export async function importRosterCsv(rows: Record<string, string>[]): Promise<ImportResult> {
  const staff = await getCurrentStaff();
  if (!IMPORT_ROLES.has(staff.role)) {
    throw new Error("Not authorized to import students.");
  }
  const supabase = await createClient();

  let success = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const grade = String(row.grade_level ?? "").trim();
    if (!row.first_name || !row.last_name) {
      errors.push(`Row ${i + 1}: missing first or last name`);
      continue;
    }
    if (!VALID_GRADES.has(grade)) {
      errors.push(`Row ${i + 1}: invalid grade_level "${grade}"`);
      continue;
    }

    const { data, error } = await supabase
      .from("students")
      .insert({
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        grade_level: grade,
        enrollment_type: row.enrollment_type === "public_transfer" ? "public_transfer" : "private_continuing",
        date_of_birth: row.date_of_birth || null,
        gpa: row.gpa ? Number(row.gpa) : null,
        credits_earned: row.credits_earned ? Number(row.credits_earned) : 0,
      })
      .select("id")
      .single();

    if (error) {
      errors.push(`Row ${i + 1}: ${error.message}`);
      continue;
    }

    if (staff.role === "counselor") {
      const { error: assignError } = await supabase
        .from("staff_student_assignments")
        .insert({ staff_id: staff.id, student_id: data.id });
      if (assignError) {
        errors.push(`Row ${i + 1}: student created but auto-assignment failed (${assignError.message}) — ask an admin to assign you.`);
      }
    }
    await logAudit({ staffId: staff.id, studentId: data.id, action: "create", tableName: "students", recordId: data.id, details: { source: "csv_import" } });
    success++;
  }

  return { success, failed: rows.length - success, errors };
}

export async function importTestScoresCsv(rows: Record<string, string>[]): Promise<ImportResult> {
  const staff = await getCurrentStaff();
  if (!IMPORT_ROLES.has(staff.role)) {
    throw new Error("Not authorized to import test scores.");
  }
  const supabase = await createClient();

  let success = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const testType = String(row.test_type ?? "").trim().toUpperCase();
    if (!VALID_TEST_TYPES.has(testType)) {
      errors.push(`Row ${i + 1}: invalid test_type "${row.test_type}"`);
      continue;
    }
    const match = await findStudentMatch(supabase, row.student_first_name ?? "", row.student_last_name ?? "");
    if (!match.id) {
      errors.push(
        match.ambiguous
          ? `Row ${i + 1}: multiple students named "${row.student_first_name} ${row.student_last_name}" — resolve the duplicate before importing.`
          : `Row ${i + 1}: no matching student found for "${row.student_first_name} ${row.student_last_name}"`
      );
      continue;
    }
    const studentId = match.id;
    if (!row.test_date || !row.school_year) {
      errors.push(`Row ${i + 1}: missing test_date or school_year`);
      continue;
    }

    const { error } = await supabase.from("test_scores").insert({
      student_id: studentId,
      test_type: testType,
      subject: row.subject || null,
      score: row.score ? Number(row.score) : null,
      percentile: row.percentile ? Number(row.percentile) : null,
      test_date: row.test_date,
      school_year: row.school_year,
      source: "csv_import",
      created_by: staff.id,
    });

    if (error) {
      errors.push(`Row ${i + 1}: ${error.message}`);
      continue;
    }
    success++;
  }

  return { success, failed: rows.length - success, errors };
}

export async function importTranscriptCsv(rows: Record<string, string>[]): Promise<ImportResult> {
  const staff = await getCurrentStaff();
  if (!IMPORT_ROLES.has(staff.role)) {
    throw new Error("Not authorized to import transcript data.");
  }
  const supabase = await createClient();

  let success = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const match = await findStudentMatch(supabase, row.student_first_name ?? "", row.student_last_name ?? "");
    if (!match.id) {
      errors.push(
        match.ambiguous
          ? `Row ${i + 1}: multiple students named "${row.student_first_name} ${row.student_last_name}" — resolve the duplicate before importing.`
          : `Row ${i + 1}: no matching student found for "${row.student_first_name} ${row.student_last_name}"`
      );
      continue;
    }
    const studentId = match.id;
    if (!row.course_name || !row.subject_area || !row.school_year) {
      errors.push(`Row ${i + 1}: missing course_name, subject_area, or school_year`);
      continue;
    }
    if (!CANONICAL_SUBJECT_AREAS.has(row.subject_area)) {
      errors.push(
        `Row ${i + 1}: unrecognized subject_area "${row.subject_area}" — must be one of ${[...CANONICAL_SUBJECT_AREAS].join(", ")}. These credits would not count toward the graduation audit.`
      );
      continue;
    }

    const { error } = await supabase.from("transcript_entries").insert({
      student_id: studentId,
      course_name: row.course_name,
      subject_area: row.subject_area,
      credit_value: row.credit_value ? Number(row.credit_value) : 1.0,
      grade: row.grade || null,
      school_year: row.school_year,
      is_online: String(row.is_online).toLowerCase() === "true",
      is_dual_enrollment: String(row.is_dual_enrollment).toLowerCase() === "true",
      source: "csv_import",
    });

    if (error) {
      errors.push(`Row ${i + 1}: ${error.message}`);
      continue;
    }
    success++;
  }

  return { success, failed: rows.length - success, errors };
}
