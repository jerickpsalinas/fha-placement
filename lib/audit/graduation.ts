import type { TranscriptEntry, GraduationRequirement, OnlineLearningRecord } from "@/types";

export interface SubjectAreaAudit {
  subjectArea: string;
  creditsRequired: number;
  creditsEarned: number;
  creditsRemaining: number;
  satisfied: boolean;
  notes: string | null;
}

export interface GraduationAudit {
  schoolYear: string;
  totalCreditsRequired: number;
  totalCreditsEarned: number;
  totalCreditsRemaining: number;
  subjectAreas: SubjectAreaAudit[];
  onlineLearningRequirementMet: boolean;
  deficiencies: string[];
  scholarshipReadinessFlags: string[];
}

/**
 * Compares a student's transcript entries against the configured graduation
 * requirements for a given school year and produces a structured audit.
 *
 * This is intentionally conservative: it flags gaps rather than guessing.
 * Course-to-subject-area mapping relies on the `subject_area` field set when
 * the transcript entry was created/imported, so accurate categorization at
 * entry time directly determines audit accuracy.
 */
export function runGraduationAudit(
  transcript: TranscriptEntry[],
  requirements: GraduationRequirement[],
  onlineLearningRecords: OnlineLearningRecord[],
  schoolYear: string,
  gpa: number | null
): GraduationAudit {
  const creditsBySubject = new Map<string, number>();
  for (const entry of transcript) {
    const current = creditsBySubject.get(entry.subject_area) ?? 0;
    creditsBySubject.set(entry.subject_area, current + Number(entry.credit_value));
  }

  const subjectAreas: SubjectAreaAudit[] = requirements
    .filter((r) => r.subject_area !== "Online Learning Requirement")
    .map((req) => {
      const earned = creditsBySubject.get(req.subject_area) ?? 0;
      const remaining = Math.max(0, req.credits_required - earned);
      return {
        subjectArea: req.subject_area,
        creditsRequired: req.credits_required,
        creditsEarned: earned,
        creditsRemaining: remaining,
        satisfied: earned >= req.credits_required,
        notes: req.notes,
      };
    });

  const totalCreditsRequired = subjectAreas.reduce((sum, s) => sum + s.creditsRequired, 0);
  const totalCreditsEarned = subjectAreas.reduce((sum, s) => sum + Math.min(s.creditsEarned, s.creditsRequired), 0)
    + transcript
        .filter((e) => !requirements.some((r) => r.subject_area === e.subject_area))
        .reduce((sum, e) => sum + Number(e.credit_value), 0); // uncategorized/extra credits still count toward total
  const totalCreditsRemaining = Math.max(0, totalCreditsRequired - totalCreditsEarned);

  const deficiencies = subjectAreas
    .filter((s) => !s.satisfied)
    .map((s) => `${s.subjectArea}: needs ${s.creditsRemaining.toFixed(2)} more credit(s)`);

  const onlineLearningRequirementMet = onlineLearningRecords.some(
    (r) => r.school_year === schoolYear && r.requirement_met
  ) || onlineLearningRecords.some((r) => r.requirement_met); // met in any prior year still counts

  if (!onlineLearningRequirementMet) {
    deficiencies.push("Online Learning Requirement: not yet completed");
  }

  const scholarshipReadinessFlags: string[] = [];
  if (gpa !== null) {
    if (gpa < 3.0) {
      scholarshipReadinessFlags.push(
        `GPA of ${gpa.toFixed(2)} is below the 3.0 threshold commonly required for Florida scholarship programs (e.g., Bright Futures Medallion) — confirm current-year requirements`
      );
    }
  } else {
    scholarshipReadinessFlags.push("GPA not on file — cannot evaluate scholarship readiness");
  }

  const hasDualEnrollment = transcript.some((e) => e.is_dual_enrollment);
  if (!hasDualEnrollment && gpa !== null && gpa >= 3.5) {
    scholarshipReadinessFlags.push(
      "Student's GPA suggests dual enrollment eligibility may be worth exploring if not already pursued"
    );
  }

  return {
    schoolYear,
    totalCreditsRequired,
    totalCreditsEarned,
    totalCreditsRemaining,
    subjectAreas,
    onlineLearningRequirementMet,
    deficiencies,
    scholarshipReadinessFlags,
  };
}
