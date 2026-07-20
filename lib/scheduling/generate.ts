import type { Student, AcademicPathway } from "@/types";
import type { GraduationAudit } from "@/lib/audit/graduation";
import type { EdgeRecommendation } from "@/lib/recommendations/edge";

/**
 * Rule-based draft schedule generator.
 *
 * Given a student, their graduation audit (subject-area gaps + online-learning
 * status), any scheduling-relevant accommodations, and EDGE recommendations,
 * this proposes a set of course blocks and the pathways that best fit.
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

export interface GeneratedSchedule {
  pathways: AcademicPathway[];
  blocks: GeneratedBlock[];
  /** Human-readable explanation of how the draft was assembled. */
  rationale: string[];
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

const MAX_BLOCKS = 7; // typical daily period count; keeps drafts realistic

export function generateDraftSchedule(
  student: Student,
  audit: GraduationAudit,
  schedulingAccommodations: { description: string }[],
  edgeRecs: EdgeRecommendation[]
): GeneratedSchedule {
  const blocks: GeneratedBlock[] = [];
  const rationale: string[] = [];
  const pathways = new Set<AcademicPathway>();

  const gradeNum = student.grade_level === "K" ? 0 : parseInt(student.grade_level, 10);
  const accommodationNote =
    schedulingAccommodations.length > 0
      ? schedulingAccommodations.map((a) => a.description).join("; ")
      : null;

  // 1. Prioritize unmet core-subject requirements, largest gap first.
  const gaps = audit.subjectAreas
    .filter((s) => !s.satisfied && s.creditsRemaining > 0)
    .sort((a, b) => b.creditsRemaining - a.creditsRemaining);

  let period = 1;
  for (const gap of gaps) {
    if (blocks.length >= MAX_BLOCKS) break;
    const baseCourse = SUBJECT_TO_COURSE[gap.subjectArea] ?? gap.subjectArea;

    // Honors vs. intervention framing based on GPA.
    let category = "core";
    let coursePrefix = "";
    if (student.gpa !== null && student.gpa >= 3.5) {
      category = "honors";
      coursePrefix = "Honors ";
      pathways.add("advanced_honors");
    } else if (student.gpa !== null && student.gpa < 2.0) {
      category = "intervention";
      pathways.add("intervention");
    } else {
      pathways.add("standard");
    }

    blocks.push({
      block_label: `Period ${period++}`,
      course_name: `${coursePrefix}${baseCourse}`,
      course_category: category,
      is_online: false,
      notes: `Fills ${gap.subjectArea} gap (${gap.creditsRemaining.toFixed(1)} credit(s) remaining)${accommodationNote ? ` · Accommodation: ${accommodationNote}` : ""}`,
    });
    rationale.push(
      `Added ${gap.subjectArea} to close a ${gap.creditsRemaining.toFixed(1)}-credit gap toward graduation.`
    );
  }

  // 2. Online-learning requirement: place an online course if not yet met.
  if (!audit.onlineLearningRequirementMet && blocks.length < MAX_BLOCKS) {
    blocks.push({
      block_label: `Period ${period++}`,
      course_name: "Online Elective (e.g. FLVS)",
      course_category: "online",
      is_online: true,
      notes: "Satisfies Florida online-learning graduation requirement (not yet met).",
    });
    rationale.push("Added an online course to satisfy the outstanding online-learning requirement.");
  }

  // 3. Credit recovery for students significantly behind on total credits.
  const expectedCreditsByGrade = Math.max(0, (gradeNum - 8) * 6); // ~6 credits/yr in HS
  if (
    gradeNum >= 9 &&
    student.credits_earned < expectedCreditsByGrade - 3 &&
    blocks.length < MAX_BLOCKS
  ) {
    pathways.add("credit_recovery");
    blocks.push({
      block_label: `Period ${period++}`,
      course_name: "Credit Recovery",
      course_category: "credit_recovery",
      is_online: true,
      notes: `Behind pace: ${student.credits_earned} credits earned vs ~${expectedCreditsByGrade} expected by grade ${gradeNum}.`,
    });
    rationale.push("Added credit recovery — student is meaningfully behind the expected credit pace.");
  }

  // 4. Dual enrollment / college-prep framing for strong upper-grade students.
  if (student.dual_enrollment_active) {
    pathways.add("dual_enrollment");
  }
  if (gradeNum >= 11 && student.gpa !== null && student.gpa >= 3.0) {
    pathways.add("college_preparatory");
    if (blocks.length < MAX_BLOCKS) {
      blocks.push({
        block_label: `Period ${period++}`,
        course_name: student.dual_enrollment_active ? "Dual Enrollment Course" : "ACT/SAT Prep",
        course_category: student.dual_enrollment_active ? "dual_enrollment" : "act_sat_prep",
        is_online: false,
        notes: "College-preparatory placement based on grade level and GPA.",
      });
      rationale.push("Added a college-prep block (dual enrollment or test prep) for an upper-grade, college-track student.");
    }
  }

  // 5. EDGE career elective if there's a strong recommendation and room left.
  if (edgeRecs.length > 0 && blocks.length < MAX_BLOCKS) {
    pathways.add("edge_career");
    const top = edgeRecs[0];
    blocks.push({
      block_label: `Period ${period++}`,
      course_name: "EDGE Career Pathway Elective",
      course_category: "edge",
      is_online: false,
      notes: `Suggested EDGE focus: ${top.reason}`,
    });
    rationale.push("Added an EDGE career elective aligned to the student's top pathway recommendation.");
  }

  // 6. Support pathways always reflect plan status.
  if (student.has_iep) pathways.add("iep_support");
  if (student.has_504) pathways.add("504_support");

  // Guarantee at least the standard pathway so a draft is never empty.
  if (pathways.size === 0) pathways.add("standard");
  if (blocks.length === 0) {
    rationale.push(
      "No open graduation gaps detected — draft left empty for the counselor to add enrichment/elective choices."
    );
  }

  return {
    pathways: [...pathways],
    blocks,
    rationale,
  };
}
