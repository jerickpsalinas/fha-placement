export type StaffRole = "admin" | "counselor" | "teacher" | "read_only";

export interface StaffProfile {
  id: string;
  full_name: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
}

export type GradeLevel =
  | "K" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12";

export type EnrollmentType = "private_continuing" | "public_transfer";

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  grade_level: GradeLevel;
  enrollment_type: EnrollmentType;
  enrollment_date: string;
  prior_school: string | null;
  gpa: number | null;
  credits_earned: number;
  has_iep: boolean;
  has_504: boolean;
  dual_enrollment_active: boolean;
  career_goals: string | null;
  college_goals: string | null;
  edge_interests: string[] | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type TestType = "MAP" | "FAST" | "IXL" | "ACT" | "SAT";

export interface TestScore {
  id: string;
  student_id: string;
  test_type: TestType;
  subject: string | null;
  score: number | null;
  percentile: number | null;
  proficiency_level: string | null;
  test_date: string;
  school_year: string;
  source: string;
  created_by: string | null;
  created_at: string;
}

export interface TranscriptEntry {
  id: string;
  student_id: string;
  course_name: string;
  subject_area: string;
  credit_value: number;
  grade: string | null;
  term: string | null;
  school_year: string;
  school_of_origin: string | null;
  is_honors: boolean;
  is_dual_enrollment: boolean;
  is_online: boolean;
  online_provider: string | null;
  source: string;
  created_at: string;
}

export type PlanType = "IEP" | "504";
export type AccommodationCategory =
  | "instructional" | "testing" | "scheduling" | "environmental" | "behavioral" | "service_minutes";

export interface SupportPlan {
  id: string;
  student_id: string;
  plan_type: PlanType;
  effective_date: string | null;
  review_date: string | null;
  service_minutes_weekly: number | null;
  document_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Accommodation {
  id: string;
  support_plan_id: string;
  category: AccommodationCategory;
  description: string;
  affects_scheduling: boolean;
  created_at: string;
}

export interface OnlineLearningRecord {
  id: string;
  student_id: string;
  requirement_met: boolean;
  credits_earned_online: number;
  provider: string | null;
  course_name: string | null;
  school_year: string;
  notes: string | null;
  created_at: string;
}

export interface GraduationRequirement {
  id: string;
  school_year: string;
  subject_area: string;
  credits_required: number;
  notes: string | null;
}

export type AcademicPathway =
  | "standard" | "advanced_honors" | "intervention" | "credit_recovery" | "iep_support"
  | "504_support" | "dual_enrollment" | "college_preparatory" | "edge_career" | "certification";

export type ScheduleStatus = "draft" | "pending_approval" | "approved" | "rejected";

export interface Schedule {
  id: string;
  student_id: string;
  school_year: string;
  pathways: AcademicPathway[];
  status: ScheduleStatus;
  generated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBlock {
  id: string;
  schedule_id: string;
  block_label: string;
  course_name: string;
  course_category: string;
  is_online: boolean;
  notes: string | null;
}

export type EdgePathway =
  | "quickbooks_certification" | "entrepreneurship" | "financial_literacy" | "public_speaking"
  | "leadership_development" | "workforce_readiness" | "career_exploration"
  | "technology_certifications" | "trades_exploration" | "community_service"
  | "business_ownership" | "college_career_readiness";

export interface StudentEdgePathway {
  id: string;
  student_id: string;
  pathway: EdgePathway;
  status: "recommended" | "selected" | "in_progress" | "completed";
  recommended_reason: string | null;
  selected_by: string | null;
  created_at: string;
}

export const EDGE_PATHWAY_LABELS: Record<EdgePathway, string> = {
  quickbooks_certification: "QuickBooks Online Certification",
  entrepreneurship: "Entrepreneurship",
  financial_literacy: "Financial Literacy",
  public_speaking: "Public Speaking",
  leadership_development: "Leadership Development",
  workforce_readiness: "Workforce Readiness",
  career_exploration: "Career Exploration",
  technology_certifications: "Technology Certifications",
  trades_exploration: "Trades Exploration",
  community_service: "Community Service",
  business_ownership: "Business Ownership",
  college_career_readiness: "College and Career Readiness",
};

export const PATHWAY_LABELS: Record<AcademicPathway, string> = {
  standard: "Standard Academic Path",
  advanced_honors: "Advanced/Honors Path",
  intervention: "Intervention Path",
  credit_recovery: "Credit Recovery Path",
  iep_support: "IEP Support Path",
  "504_support": "504 Support Path",
  dual_enrollment: "Dual Enrollment Path",
  college_preparatory: "College Preparatory Path",
  edge_career: "EDGE Career Pathway",
  certification: "Certification Pathway",
};
