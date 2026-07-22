import type { Student, AcademicPathway, TestScore } from "@/types";
import type { GraduationAudit } from "@/lib/audit/graduation";
import type { EdgeRecommendation } from "@/lib/recommendations/edge";

/**
 * Rule-based draft schedule generator.
 *
 * Given a student, their graduation audit (subject-area gaps + online-learning
 * status), recent test scores, scheduling-relevant accommodations, and EDGE
 * recommendations, this proposes a set of course blocks and the pathways that
 * best fit.
 *
 * Like the rest of this app it is deliberately transparent and conservative:
 * it fills gaps subject-by-subject and annotates *why* each block was placed.
 * It produces a DRAFT only — a counselor reviews, edits, and submits it through
 * the existing approval workflow. Nothing here is auto-approved.
 */

export interface GeneratedBlock {
  block_label: string;
  course_name: string;
  course_category: string;
  is_online: boolean;
  notes: string | null;
}

/** A specific, citable reason the student was placed into intervention. */
export interface InterventionFinding {
  reason: string;
  /** Graduation subject area this finding points at, when it maps to one. */
  subject: string | null;
}

export interface GeneratedSchedule {
  pathways: AcademicPathway[];
  blocks: GeneratedBlock[];
  /** Human-readable explanation of how the draft was assembled. */
  rationale: string[];
  /** Why the student was (or wasn't) flagged for intervention. */
  interventionFindings: InterventionFinding[];
  /** Conditions that limited what could be generated (shown to staff). */
  warnings: string[];
}

/** Maps a graduation subject-area bucket to a sensible default course name. */
const SUBJECT_TO_COURSE: Record<string, string> = {
  "English/Language Arts": "English / Language Arts",
  Mathematics: "Mathematics",
  Science: "Science",
  "Social Studies": "Social Studies",
  "Physical Education": "Physical Education / Health",
  "Fine/Performing Arts, Speech, or Practical Arts": "Fine / Performing Arts Elective",
  "World Language": "World Language",
  Electives: "Elective",
};

/**
 * Default 7-period bell schedule used to label blocks with real time slots.
 * These are a starting template — adjust to the school's actual bell times.
 */
export const BELL_SCHEDULE: { label: string; time: string }[] = [
  { label: "God First",  time: "8:30–9:00" },
  { label: "Block 1",    time: "9:00–10:20" },
  { label: "Block 2",    time: "10:30–11:50" },
  { label: "Block 3",    time: "12:20–1:05" },
  { label: "Block 4",    time: "1:05–1:55" },
  { label: "Flex Block",  time: "1:55–2:30" },
];

const MAX_BLOCKS = BELL_SCHEDULE.length;

/** Credits a student is expected to have ENTERING a given grade (~6/year). */
function expectedCreditsEnteringGrade(gradeNum: number): number {
  return Math.max(0, (gradeNum - 9) * 6);
}

/** Proficiency wording that indicates a student is performing below level. */
const BELOW_LEVEL_PROFICIENCY = /below|level\s?1\b|level\s?2\b|far below|not proficient|beginning|inadequate|intervention/i;

/** Percentile at or under which a score is treated as below level. */
const BELOW_LEVEL_PERCENTILE = 25;

function isBelowLevel(score: TestScore): boolean {
  if (score.proficiency_level && BELOW_LEVEL_PROFICIENCY.test(score.proficiency_level)) return true;
  if (score.percentile !== null && score.percentile < BELOW_LEVEL_PERCENTILE) return true;
  return false;
}

/** Maps a test subject label onto a graduation subject area, when it maps. */
function subjectAreaForTestSubject(subject: string | null): string | null {
  if (!subject) return null;
  if (/math|algebra|geometry|quantitative|numer/i.test(subject)) return "Mathematics";
  if (/read|ela\b|english|language|literacy|writing/i.test(subject)) return "English/Language Arts";
  if (/scien|biolog|chem|physic/i.test(subject)) return "Science";
  return null;
}

/**
 * Determines whether a student needs academic intervention, and why.
 *
 * Deliberately multi-signal — a student can need help for reasons that have
 * nothing to do with GPA (e.g. a strong-GPA student with a below-level FAST
 * reading score). Each finding is returned so the counselor can see exactly
 * what triggered the placement rather than trusting an opaque flag.
 */
export function assessIntervention(
  student: Student,
  audit: GraduationAudit,
  testScores: TestScore[]
): InterventionFinding[] {
  const findings: InterventionFinding[] = [];
  const gradeNum = student.grade_level === "K" ? 0 : parseInt(student.grade_level, 10);

  // 1. GPA signal. 2.5 (not 2.0) so students who are quietly struggling are
  //    caught before they fail outright.
  if (student.gpa !== null && student.gpa < 2.5) {
    findings.push({
      reason: `GPA of ${student.gpa.toFixed(2)} is below the 2.5 support threshold`,
      subject: null,
    });
  }

  // 2. Below-level standardized scores — evaluate the most recent score per
  //    subject so an old low score doesn't override recent growth.
  const latestBySubject = new Map<string, TestScore>();
  for (const score of testScores) {
    const key = `${score.subject ?? "overall"}`;
    const existing = latestBySubject.get(key);
    if (!existing || score.test_date > existing.test_date) latestBySubject.set(key, score);
  }
  for (const score of latestBySubject.values()) {
    if (!isBelowLevel(score)) continue;
    const detail =
      score.proficiency_level ??
      (score.percentile !== null ? `${score.percentile}th percentile` : "below benchmark");
    findings.push({
      reason: `${score.test_type}${score.subject ? ` ${score.subject}` : ""} is below level (${detail}, ${score.test_date})`,
      subject: subjectAreaForTestSubject(score.subject),
    });
  }

  // 3. Credit pace — meaningfully behind where this grade level should be.
  const expected = expectedCreditsEnteringGrade(gradeNum);
  if (gradeNum >= 10 && student.credits_earned < expected - 3) {
    findings.push({
      reason: `${student.credits_earned} credits earned vs ~${expected} expected entering grade ${gradeNum}`,
      subject: null,
    });
  }

  // 4. Large outstanding graduation gap relative to time remaining. A student
  //    in grade N still has grades N..12 to complete, hence 13 - N years.
  const yearsLeft = Math.max(0, 13 - gradeNum);
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

  const gradeNum = student.grade_level === "K" ? 0 : parseInt(student.grade_level, 10);
  const accommodationNote =
    schedulingAccommodations.length > 0
      ? schedulingAccommodations.map((a) => a.description).join("; ")
      : null;

  const interventionFindings = assessIntervention(student, audit, testScores);
  const needsIntervention = interventionFindings.length > 0;
  // Subjects with specific below-level evidence get intervention-flavored core
  // courses; a general signal (GPA/credits) applies across the board.
  const interventionSubjects = new Set(
    interventionFindings.map((f) => f.subject).filter((s): s is string => s !== null)
  );
  const generalIntervention = interventionFindings.some((f) => f.subject === null);

  // Surface why nothing could be generated, rather than silently producing an
  // empty draft — this is the single most confusing failure mode for staff.
  if (audit.subjectAreas.length === 0) {
    warnings.push(
      `No graduation requirements are configured for ${audit.schoolYear}, so subject-area gaps could not be calculated. An administrator needs to add requirements for this school year before the generator can propose core courses.`
    );
  }

  // ---- Build candidate blocks in priority tiers ----------------------------

  // Tier 1: unmet core-subject requirements, largest gap first.
  const gapBlocks: GeneratedBlock[] = audit.subjectAreas
    .filter((s) => !s.satisfied && s.creditsRemaining > 0)
    .sort((a, b) => b.creditsRemaining - a.creditsRemaining)
    .map((gap) => {
      const baseCourse = SUBJECT_TO_COURSE[gap.subjectArea] ?? gap.subjectArea;
      const subjectFlagged = interventionSubjects.has(gap.subjectArea);

      let category = "core";
      let coursePrefix = "";
      if (subjectFlagged || generalIntervention) {
        category = "intervention";
        coursePrefix = "Supported ";
        pathways.add("intervention");
      } else if (student.gpa !== null && student.gpa >= 3.5) {
        category = "honors";
        coursePrefix = "Honors ";
        pathways.add("advanced_honors");
      }

      const why = subjectFlagged
        ? ` · Below-level ${gap.subjectArea} performance — supported section recommended`
        : "";
      return {
        block_label: "",
        course_name: `${coursePrefix}${baseCourse}`,
        course_category: category,
        is_online: false,
        notes: `Fills ${gap.subjectArea} gap (${gap.creditsRemaining.toFixed(1)} credit(s) remaining)${why}${accommodationNote ? ` · Accommodation: ${accommodationNote}` : ""}`,
      };
    });

  // Tier 2: support blocks — these must not be squeezed out by electives.
  const supportBlocks: GeneratedBlock[] = [];
  if (student.has_iep) {
    pathways.add("iep_support");
    supportBlocks.push({
      block_label: "",
      course_name: "IEP Support / Resource Period",
      course_category: "intervention",
      is_online: false,
      notes: `Dedicated support period for IEP service delivery${accommodationNote ? ` · Accommodation: ${accommodationNote}` : ""}`,
    });
  }
  if (student.has_504) {
    pathways.add("504_support");
    if (!student.has_iep) {
      supportBlocks.push({
        block_label: "",
        course_name: "504 Support Check-in",
        course_category: "intervention",
        is_online: false,
        notes: `Scheduled check-in to monitor 504 accommodations${accommodationNote ? ` · Accommodation: ${accommodationNote}` : ""}`,
      });
    }
  }
  // Targeted lab for each subject with below-level evidence.
  for (const subject of interventionSubjects) {
    supportBlocks.push({
      block_label: "",
      course_name: `${subject === "English/Language Arts" ? "Reading" : subject} Intervention Lab`,
      course_category: "intervention",
      is_online: false,
      notes:
        interventionFindings
          .filter((f) => f.subject === subject)
          .map((f) => f.reason)
          .join("; ") || `Targeted support in ${subject}`,
    });
  }
  if (needsIntervention) pathways.add("intervention");

  // Tier 3: outstanding graduation requirements.
  const requirementBlocks: GeneratedBlock[] = [];
  if (!audit.onlineLearningRequirementMet) {
    requirementBlocks.push({
      block_label: "",
      course_name: "Online Elective (e.g. FLVS)",
      course_category: "online",
      is_online: true,
      notes: "Satisfies Florida online-learning graduation requirement (not yet met).",
    });
  }
  const expected = expectedCreditsEnteringGrade(gradeNum);
  if (gradeNum >= 10 && student.credits_earned < expected - 3) {
    pathways.add("credit_recovery");
    requirementBlocks.push({
      block_label: "",
      course_name: "Credit Recovery",
      course_category: "credit_recovery",
      is_online: true,
      notes: `Behind pace: ${student.credits_earned} credits earned vs ~${expected} expected entering grade ${gradeNum}.`,
    });
  }

  // Tier 4: enrichment — first to be dropped when the day is full.
  const enrichmentBlocks: GeneratedBlock[] = [];
  if (student.dual_enrollment_active) pathways.add("dual_enrollment");
  // Only steer a student toward college-prep load if they aren't in intervention.
  if (gradeNum >= 11 && student.gpa !== null && student.gpa >= 3.0 && !needsIntervention) {
    pathways.add("college_preparatory");
    enrichmentBlocks.push({
      block_label: "",
      course_name: student.dual_enrollment_active ? "Dual Enrollment Course" : "ACT/SAT Prep",
      course_category: student.dual_enrollment_active ? "dual_enrollment" : "act_sat_prep",
      is_online: false,
      notes: "College-preparatory placement based on grade level and GPA.",
    });
  }
  if (edgeRecs.length > 0) {
    pathways.add("edge_career");
    enrichmentBlocks.push({
      block_label: "",
      course_name: "EDGE Career Pathway Elective",
      course_category: "edge",
      is_online: false,
      notes: `Suggested EDGE focus: ${edgeRecs[0].reason}`,
    });
  }

  // ---- Assemble within the day, protecting anchored blocks -----------------
  // God First is always first; Flex Block is always last. The 4 middle slots
  // (Block 1–4) are filled from gap/support/requirement/enrichment tiers.
  const MIDDLE_SLOTS = MAX_BLOCKS - 2; // exclude God First + Flex Block

  const godFirstBlock: GeneratedBlock = {
    block_label: "",
    course_name: "God First / Bible",
    course_category: "core",
    is_online: false,
    notes: "Fixed daily devotional and Bible instruction block.",
  };

  // Determine what goes in the Flex Block (last period).
  let flexBlock: GeneratedBlock;
  const flexIntervention = supportBlocks.shift();
  if (flexIntervention) {
    flexBlock = flexIntervention;
  } else if (needsIntervention && interventionSubjects.size > 0) {
    const firstSubject = [...interventionSubjects][0];
    flexBlock = {
      block_label: "",
      course_name: `${firstSubject === "English/Language Arts" ? "Reading" : firstSubject} Intervention Lab`,
      course_category: "intervention",
      is_online: false,
      notes: interventionFindings.filter((f) => f.subject === firstSubject).map((f) => f.reason).join("; ") || `Targeted support in ${firstSubject}`,
    };
  } else {
    flexBlock = {
      block_label: "",
      course_name: "Academic Flex / Study Hall",
      course_category: "elective",
      is_online: false,
      notes: "Open flex period — study hall, tutoring, or enrichment.",
    };
  }

  const reserved = Math.min(supportBlocks.length + requirementBlocks.length, MIDDLE_SLOTS - 1);
  const middleBlocks: GeneratedBlock[] = [
    ...gapBlocks.slice(0, Math.max(1, MIDDLE_SLOTS - reserved)),
    ...supportBlocks,
    ...requirementBlocks,
    ...enrichmentBlocks,
  ].slice(0, MIDDLE_SLOTS);

  const blocks: GeneratedBlock[] = [godFirstBlock, ...middleBlocks, flexBlock];

  // Assign real period labels + times now that ordering is final.
  blocks.forEach((block, i) => {
    const slot = BELL_SCHEDULE[i];
    block.block_label = `${slot.label} (${slot.time})`;
  });

  // ---- Rationale ----------------------------------------------------------
  for (const b of blocks) rationale.push(`${b.block_label}: ${b.course_name} — ${b.notes ?? ""}`);
  if (needsIntervention) {
    rationale.push(
      `Intervention placement triggered by: ${interventionFindings.map((f) => f.reason).join("; ")}.`
    );
  } else {
    rationale.push("No intervention signals detected (GPA, test scores, and credit pace all within range).");
  }
  const droppedCount =
    gapBlocks.length + supportBlocks.length + requirementBlocks.length + enrichmentBlocks.length - middleBlocks.length;
  if (droppedCount > 0) {
    warnings.push(
      `${droppedCount} additional recommended course(s) did not fit in a ${MIDDLE_SLOTS}-block schedule and were left off — review and prioritize manually.`
    );
  }

  // A student in intervention/credit recovery is not "standard" — only apply
  // the standard pathway when nothing more specific fits.
  if (pathways.size === 0) pathways.add("standard");
  if (blocks.length === 0) {
    rationale.push(
      "No course blocks could be generated. Check that graduation requirements exist for this school year and that the student's transcript is loaded."
    );
  }

  return { pathways: [...pathways], blocks, rationale, interventionFindings, warnings };
}
