"use server";

import pdf from "pdf-parse/lib/pdf-parse.js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/queries";
import { parseTranscriptText, SUBJECT_AREAS, type ParsedTranscriptRow } from "@/lib/parsing/transcript";

export interface ExtractResult {
  rows: ParsedTranscriptRow[];
  rawTextPreview: string;
  error?: string;
}

/**
 * Extracts text from an uploaded transcript/report-card PDF and runs the
 * heuristic parser. Returns candidate rows for staff review — this action
 * NEVER writes to the database. Saving is a separate, explicit step.
 */
export async function extractTranscriptPdf(formData: FormData): Promise<ExtractResult> {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin" && staff.role !== "counselor") {
    throw new Error("Not authorized to import transcript data.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { rows: [], rawTextPreview: "", error: "No file uploaded." };
  }
  if (file.type && file.type !== "application/pdf") {
    return { rows: [], rawTextPreview: "", error: "Please upload a PDF file." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);
    const text = parsed.text ?? "";
    if (!text.trim()) {
      return {
        rows: [],
        rawTextPreview: "",
        error:
          "No text could be extracted. This is likely a scanned/image-only PDF, which needs OCR (not yet supported). Enter the courses manually or import via CSV.",
      };
    }
    const rows = parseTranscriptText(text);
    return { rows, rawTextPreview: text.slice(0, 4000) };
  } catch (err) {
    return {
      rows: [],
      rawTextPreview: "",
      error: err instanceof Error ? err.message : "Failed to read the PDF.",
    };
  }
}

export interface SaveResult {
  saved: number;
  error?: string;
}

const VALID_SUBJECT_AREAS = new Set<string>(SUBJECT_AREAS);

/**
 * Persists the staff-reviewed rows to transcript_entries for a student.
 * Rows must already have been confirmed in the review UI.
 */
export async function saveReviewedTranscriptRows(
  studentId: string,
  rows: ParsedTranscriptRow[]
): Promise<SaveResult> {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin" && staff.role !== "counselor") {
    throw new Error("Not authorized to import transcript data.");
  }
  const supabase = await createClient();

  const cleaned = rows
    .filter((r) => r.course_name.trim() && r.subject_area && r.school_year.trim())
    .map((r) => ({
      student_id: studentId,
      course_name: r.course_name.trim(),
      subject_area: VALID_SUBJECT_AREAS.has(r.subject_area) ? r.subject_area : "Electives",
      credit_value: Number.isFinite(r.credit_value) ? r.credit_value : 1.0,
      grade: r.grade.trim() || null,
      school_year: r.school_year.trim(),
      is_online: r.is_online,
      is_dual_enrollment: r.is_dual_enrollment,
      source: "pdf_import",
    }));

  if (cleaned.length === 0) {
    return { saved: 0, error: "No complete rows to save. Each row needs a course name, subject area, and school year." };
  }

  const { error } = await supabase.from("transcript_entries").insert(cleaned);
  if (error) return { saved: 0, error: error.message };

  await logAudit({
    staffId: staff.id,
    studentId,
    action: "create",
    tableName: "transcript_entries",
    details: { source: "pdf_import", count: cleaned.length },
  });

  return { saved: cleaned.length };
}
