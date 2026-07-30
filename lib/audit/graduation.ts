import type { TranscriptEntry, GraduationRequirement, OnlineLearningRecord } from "@/types";

export interface SubjectAreaAudit {
  subjectArea: string;
  creditsRequired: number;
  creditsEarned: number;
  creditsRemaining: number;
  satisfied: boolean;
  notes: string | null;
}

/**
 * FHA-specific graduation expectations that sit OUTSIDE the Florida 24-credit
 * count (per client confirmation): Bible is a required institutional credit
 * tracked on its own, while World Language/Community Service/Senior Capstone
 * are informational-only (not required, or not yet trackable from available
 * data) — creditsRequired/satisfied are null when not applicable.
 */
export interface InstitutionalRequirement {
  key: string;
  label: string;
  creditsRequired: number | null;
  creditsEarned: number | null;
  satisfied: boolean | null;
  note: string;
}

const BIBLE_CREDITS_REQUIRED = 4.0;

export interface GraduationAudit {
  schoolYear: string;
  totalCreditsRequired: number;
  totalCreditsEarned: number;
  totalCreditsRemaining: number;
  subjectAreas: SubjectAreaAudit[];
  institutionalRequirements: InstitutionalRequirement[];
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

  // Bible and World Language are tracked separately (institutionalRequirements
  // below) and must not inflate the Florida 24-credit total as "extra" credits.
  const NON_FLORIDA_SUBJECT_AREAS = new Set(["God First/Bible", "World Language"]);

  const totalCreditsRequired = subjectAreas.reduce((sum, s) => sum + s.creditsRequired, 0);
  const totalCreditsEarned = subjectAreas.reduce((sum, s) => sum + Math.min(s.creditsEarned, s.creditsRequired), 0)
    + transcript
        .filter((e) => !requirements.some((r) => r.subject_area === e.subject_area) && !NON_FLORIDA_SUBJECT_AREAS.has(e.subject_area))
        .reduce((sum, e) => sum + Number(e.credit_value), 0); // uncategorized/extra credits still count toward total
  const totalCreditsRemaining = Math.max(0, totalCreditsRequired - totalCreditsEarned);

  const deficiencies = subjectAreas
    .filter((s) => !s.satisfied)
    .map((s) => `${s.subjectArea}: needs ${s.creditsRemaining.toFixed(2)} more credit(s)`);

  // FL online-learning requirement is a one-time graduation gate: once met in
  // ANY year it stays met. Check the audited year first for a fast path, then
  // fall back to any prior year. .some() on an empty array correctly returns false.
  const onlineLearningRequirementMet = onlineLearningRecords.some(
    (r) => r.school_year === schoolYear && r.requirement_met
  ) || onlineLearningRecords.some((r) => r.requirement_met);

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

  const bibleCreditsEarned = creditsBySubject.get("God First/Bible") ?? 0;
  const worldLanguageCreditsEarned = creditsBySubject.get("World Language") ?? 0;

  const institutionalRequirements: InstitutionalRequirement[] = [
    {
      key: "bible",
      label: "Bible",
      creditsRequired: BIBLE_CREDITS_REQUIRED,
      creditsEarned: bibleCreditsEarned,
      satisfied: bibleCreditsEarned >= BIBLE_CREDITS_REQUIRED,
      note: "FHA institutional requirement — 1 credit each year, 4 total. Not part of the Florida 24-credit count.",
    },
    {
      key: "world_language",
      label: "World Language",
      creditsRequired: null,
      creditsEarned: worldLanguageCreditsEarned,
      satisfied: null,
      note: "Optional for graduation. Recommended for students planning to attend a four-year university (2 credits of the same language) — tracked as a college-readiness indicator.",
    },
    {
      key: "community_service",
      label: "Community Service / Service Learning",
      creditsRequired: null,
      creditsEarned: null,
      satisfied: null,
      note: "If applicable — not yet tracked in this system.",
    },
    {
      key: "senior_capstone",
      label: "Senior Capstone",
      creditsRequired: null,
      creditsEarned: null,
      satisfied: null,
      note: "If applicable — not yet tracked in this system.",
    },
  ];

  return {
    schoolYear,
    totalCreditsRequired,
    totalCreditsEarned,
    totalCreditsRemaining,
    subjectAreas,
    institutionalRequirements,
    onlineLearningRequirementMet,
    deficiencies,
    scholarshipReadinessFlags,
  };
}
