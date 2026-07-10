import type { Student, EdgePathway } from "@/types";

export interface EdgeRecommendation {
  pathway: EdgePathway;
  reason: string;
}

/**
 * Suggests EDGE pathways based on a student's stated interests, career/college
 * goals, and grade level. This is intentionally a transparent, rule-based
 * matcher (not a black box) so counselors can see exactly why each pathway
 * was suggested and confirm or reject it — recommendations never auto-enroll
 * a student.
 */
export function recommendEdgePathways(student: Student): EdgeRecommendation[] {
  const recommendations: EdgeRecommendation[] = [];
  const interests = (student.edge_interests ?? []).map((i) => i.toLowerCase());
  const goals = `${student.career_goals ?? ""} ${student.college_goals ?? ""}`.toLowerCase();
  const gradeNum = student.grade_level === "K" ? 0 : parseInt(student.grade_level, 10);

  const matchers: { pathway: EdgePathway; test: () => boolean; reason: string }[] = [
    {
      pathway: "quickbooks_certification",
      test: () => interests.includes("accounting") || interests.includes("bookkeeping") || goals.includes("accounting") || goals.includes("finance"),
      reason: "Stated interest or goal related to accounting/finance",
    },
    {
      pathway: "entrepreneurship",
      test: () => interests.includes("entrepreneurship") || goals.includes("start") && goals.includes("business"),
      reason: "Stated interest in entrepreneurship or starting a business",
    },
    {
      pathway: "financial_literacy",
      test: () => gradeNum >= 6, // recommended as a baseline for all middle/high schoolers
      reason: "Recommended baseline pathway for grades 6 and up",
    },
    {
      pathway: "public_speaking",
      test: () => interests.includes("public speaking") || interests.includes("leadership") || goals.includes("law") || goals.includes("politics"),
      reason: "Stated interest in public speaking/leadership or related career goal",
    },
    {
      pathway: "leadership_development",
      test: () => interests.includes("leadership") || gradeNum >= 9,
      reason: "Stated leadership interest or eligible grade band (9-12)",
    },
    {
      pathway: "workforce_readiness",
      test: () => gradeNum >= 11 && !student.dual_enrollment_active,
      reason: "Upper grade level without current dual enrollment — workforce readiness may be a strong fit",
    },
    {
      pathway: "career_exploration",
      test: () => !student.career_goals && gradeNum >= 8,
      reason: "No career goal on file yet — career exploration may help clarify direction",
    },
    {
      pathway: "technology_certifications",
      test: () => interests.includes("technology") || interests.includes("computer science") || interests.includes("it"),
      reason: "Stated interest in technology",
    },
    {
      pathway: "trades_exploration",
      test: () => interests.includes("trades") || interests.includes("construction") || interests.includes("mechanical"),
      reason: "Stated interest in trades-related fields",
    },
    {
      pathway: "community_service",
      test: () => interests.includes("community service") || interests.includes("volunteering"),
      reason: "Stated interest in community service",
    },
    {
      pathway: "business_ownership",
      test: () => goals.includes("own") && goals.includes("business"),
      reason: "Stated goal of business ownership",
    },
    {
      pathway: "college_career_readiness",
      test: () => gradeNum >= 9,
      reason: "Recommended baseline pathway for grades 9-12",
    },
  ];

  for (const m of matchers) {
    if (m.test()) {
      recommendations.push({ pathway: m.pathway, reason: m.reason });
    }
  }

  return recommendations;
}
