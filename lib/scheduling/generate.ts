import type { Student, AcademicPathway, TestScore } from "@/types";
import type { GraduationAudit } from "@/lib/audit/graduation";
import type { EdgeRecommendation } from "@/lib/recommendations/edge";
import { placeStudent, type SubjectPlacement } from "@/lib/placement/engine";
import { PLACEMENT_LEVEL_LABELS } from "@/lib/placement/norms";

export interface GeneratedBlock {
  block_label: string;
  course_name: string;
  course_category: string;
  is_online: boolean;
  notes: string | null;
  placement_level: string | null;
}

export interface InterventionFinding {
  reason: string;
  subject: string | null;
}

export interface GeneratedSchedule {
  pathways: AcademicPathway[];
  blocks: GeneratedBlock[];
  rationale: string[];
  interventionFindings: InterventionFinding[];
  warnings: string[];
  placements: SubjectPlacement[];
}

export const BELL_SCHEDULE: { label: string; time: string }[] = [
  { label: "God First",      time: "8:00–8:30" },
  { label: "ELA",            time: "8:35–10:05" },
  { label: "Math",           time: "10:10–11:40" },
  { label: "Lunch",          time: "11:40–12:10" },
  { label: "Science",        time: "12:10–1:20" },
  { label: "Social Studies", time: "1:25–2:30" },
];

function expectedCreditsEnteringGrade(gradeNum: number): number {
  return Math.max(0, (gradeNum - 9) * 6);
}

export function assessIntervention(
  student: Student,
  audit: GraduationAudit,
  testScores: TestScore[]
): InterventionFinding[] {
  const findings: InterventionFinding[] = [];
  const gNum = student.grade_level === "K" ? 0 : parseInt(student.grade_level, 10);

  if (student.gpa !== null && student.gpa < 2.5) {
    findings.push({
      reason: `GPA of ${student.gpa.toFixed(2)} is below the 2.5 support threshold`,
      subject: null,
    });
  }

  const expected = expectedCreditsEnteringGrade(gNum);
  if (gNum >= 10 && student.credits_earned < expected - 3) {
    findings.push({
      reason: `${student.credits_earned} credits earned vs ~${expected} expected entering grade ${gNum}`,
      subject: null,
    });
  }

  const yearsLeft = Math.max(0, 13 - gNum);
  if (yearsLeft > 0 && audit.totalCreditsRemaining > yearsLeft * 7) {
    findings.push({
      reason: `${audit.totalCreditsRemaining.toFixed(1)} credits remaining with ~${yearsLeft} year(s) left — above a normal course load`,
      subject: null,
    });
  }

  return findings;
}

export function generateDraftSchedule(
  student: Student,
  audit: GraduationAudit,
  schedulingAccommodations: { description: string }[],
  edgeRecs: EdgeRecommendation[],
  testScores: TestScore[] = []
): GeneratedSchedule {
  const rationale: string[] = [];
  const warnings: string[] = [];
  const pathways = new Set<AcademicPathway>();

  const gNum = student.grade_level === "K" ? 0 : parseInt(student.grade_level, 10);
  const accommodationNote =
    schedulingAccommodations.length > 0
      ? schedulingAccommodations.map((a) => a.description).join("; ")
      : null;

  // --- Per-subject placement (replaces the old generalIntervention model) ---
  const { placements, warnings: placementWarnings } = placeStudent(student, testScores);
  warnings.push(...placementWarnings);

  const interventionFindings = assessIntervention(student, audit, testScores);
  const needsIntervention = interventionFindings.length > 0 ||
    placements.some((p) => p.level === "intervention");

  if (placements.some((p) => p.level === "intervention")) pathways.add("intervention");
  if (placements.some((p) => p.level === "advanced")) pathways.add("advanced_honors");

  if (audit.subjectAreas.length === 0) {
    warnings.push(
      `No graduation requirements are configured for ${audit.schoolYear}, so subject-area gaps could not be calculated.`
    );
  }

  // --- Build blocks from per-subject placements (A-Day template) ---

  const placementBySubject = new Map(placements.map((p) => [p.subject, p]));

  function coreBlock(subject: string, slot: typeof BELL_SCHEDULE[number]): GeneratedBlock {
    const p = placementBySubject.get(subject);
    const level = p?.level ?? "on_level";
    const courseName = p?.courseName ?? subject;
    const levelLabel = PLACEMENT_LEVEL_LABELS[level];
    return {
      block_label: `${slot.label} (${slot.time})`,
      course_name: courseName,
      course_category: level === "intervention" ? "intervention" : level === "advanced" ? "honors" : "core",
      is_online: false,
      notes: p ? `${levelLabel}: ${p.why}` : null,
      placement_level: level,
    };
  }

  const biblePlacement = placementBySubject.get("God First / Bible");
  const blocks: GeneratedBlock[] = [
    {
      block_label: `${BELL_SCHEDULE[0].label} (${BELL_SCHEDULE[0].time})`,
      course_name: biblePlacement?.courseName ?? "God First / Bible",
      course_category: "core",
      is_online: false,
      notes: "Fixed daily devotional and Bible instruction block.",
      placement_level: "whole_group",
    },
    coreBlock("English/Language Arts", BELL_SCHEDULE[1]),
    coreBlock("Mathematics", BELL_SCHEDULE[2]),
    {
      block_label: `${BELL_SCHEDULE[3].label} (${BELL_SCHEDULE[3].time})`,
      course_name: "Lunch",
      course_category: "lunch",
      is_online: false,
      notes: null,
      placement_level: null,
    },
    coreBlock("Science", BELL_SCHEDULE[4]),
    coreBlock("Social Studies", BELL_SCHEDULE[5]),
  ];

  // --- Support blocks (IEP/504, credit recovery) as rationale entries ---
  if (student.has_iep) {
    pathways.add("iep_support");
    rationale.push("IEP Support: dedicated service delivery period needed — counselor should add to Flex Block or adjust schedule.");
  }
  if (student.has_504) {
    pathways.add("504_support");
    rationale.push("504 Plan: accommodations apply across all blocks — see support plan for details.");
  }

  if (!audit.onlineLearningRequirementMet) {
    rationale.push("Online learning requirement not yet met — recommend adding an online elective (e.g. FLVS).");
  }

  const expected = expectedCreditsEnteringGrade(gNum);
  if (gNum >= 10 && student.credits_earned < expected - 3) {
    pathways.add("credit_recovery");
    rationale.push(`Credit recovery needed: ${student.credits_earned} credits earned vs ~${expected} expected.`);
  }

  if (student.dual_enrollment_active) pathways.add("dual_enrollment");
  if (gNum >= 11 && student.gpa !== null && student.gpa >= 3.0 && !needsIntervention) {
    pathways.add("college_preparatory");
  }

  // --- Rationale ---
  for (const b of blocks) {
    if (b.notes) rationale.push(`${b.block_label}: ${b.course_name} — ${b.notes}`);
  }
  if (interventionFindings.length > 0) {
    rationale.push(
      `Support signals: ${interventionFindings.map((f) => f.reason).join("; ")}.`
    );
  }

  if (pathways.size === 0) pathways.add("standard");

  return {
    pathways: [...pathways],
    blocks,
    rationale,
    interventionFindings,
    warnings,
    placements,
  };
}
