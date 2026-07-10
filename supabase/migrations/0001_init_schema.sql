-- ============================================================================
-- FHA Student Placement, Graduation & Schedule Builder
-- Phase 1 schema
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- STAFF / ROLES
-- ----------------------------------------------------------------------------
-- Supabase Auth owns the actual login (auth.users). This table extends each
-- auth user with a role and display info used throughout the app.

create type staff_role as enum ('admin', 'counselor', 'teacher', 'read_only');

create table staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role staff_role not null default 'read_only',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Counselors/Teachers are assigned to specific students for scoped access.
-- (Created below, after the `students` table, since it references it.)

-- ----------------------------------------------------------------------------
-- STUDENTS
-- ----------------------------------------------------------------------------

create type enrollment_type as enum ('private_continuing', 'public_transfer');
create type grade_level as enum (
  'K','1','2','3','4','5','6','7','8','9','10','11','12'
);

create table students (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  grade_level grade_level not null,
  enrollment_type enrollment_type not null default 'private_continuing',
  enrollment_date date not null default current_date,
  prior_school text,
  gpa numeric(3,2),
  credits_earned numeric(5,2) default 0,
  has_iep boolean not null default false,
  has_504 boolean not null default false,
  dual_enrollment_active boolean not null default false,
  career_goals text,
  college_goals text,
  edge_interests text[], -- tags, e.g. {'entrepreneurship','financial_literacy'}
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_students_grade on students(grade_level);
create index idx_students_active on students(active);

-- Now that students exists, create the staff/student scoped-access table.
create table staff_student_assignments (
  staff_id uuid not null references staff_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  primary key (staff_id, student_id)
);

-- ----------------------------------------------------------------------------
-- TESTING DATA: MAP, FAST, IXL, ACT, SAT
-- ----------------------------------------------------------------------------

create type test_type as enum ('MAP', 'FAST', 'IXL', 'ACT', 'SAT');

create table test_scores (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  test_type test_type not null,
  subject text,                 -- e.g. 'Reading', 'Math', 'Science', 'ELA' (null for ACT/SAT composite)
  score numeric,
  percentile numeric,
  proficiency_level text,       -- e.g. 'Below', 'On Level', 'Advanced' (derived or entered)
  test_date date not null,
  school_year text not null,    -- e.g. '2025-2026'
  source text default 'manual', -- 'manual' | 'csv_import'
  created_by uuid references staff_profiles(id),
  created_at timestamptz not null default now()
);

create index idx_test_scores_student on test_scores(student_id);
create index idx_test_scores_type on test_scores(test_type);

-- ----------------------------------------------------------------------------
-- TRANSCRIPTS / COURSE HISTORY
-- ----------------------------------------------------------------------------

create table transcript_entries (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  course_name text not null,
  subject_area text not null,   -- maps to FL graduation credit categories, e.g. 'English', 'Math', 'Science', 'Social Studies', 'PE', 'Fine Arts', 'Elective', 'Online Learning'
  credit_value numeric(3,2) not null default 1.0,
  grade text,                   -- letter or numeric grade earned
  term text,                    -- e.g. 'Fall 2025'
  school_year text not null,
  school_of_origin text,        -- for transfer students
  is_honors boolean default false,
  is_dual_enrollment boolean default false,
  is_online boolean default false,
  online_provider text,         -- e.g. 'FLVS'
  source text default 'manual',
  created_at timestamptz not null default now()
);

create index idx_transcript_student on transcript_entries(student_id);

-- ----------------------------------------------------------------------------
-- IEP / 504
-- ----------------------------------------------------------------------------

create type plan_type as enum ('IEP', '504');
create type accommodation_category as enum (
  'instructional', 'testing', 'scheduling', 'environmental', 'behavioral', 'service_minutes'
);

create table support_plans (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  plan_type plan_type not null,
  effective_date date,
  review_date date,
  service_minutes_weekly integer,    -- for IEP service requirements
  document_url text,                  -- Supabase Storage path to uploaded PDF (Phase 1: stored, not parsed)
  notes text,
  created_by uuid references staff_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table accommodations (
  id uuid primary key default uuid_generate_v4(),
  support_plan_id uuid not null references support_plans(id) on delete cascade,
  category accommodation_category not null,
  description text not null,           -- e.g. 'Extended time (1.5x) on all assessments'
  affects_scheduling boolean default false, -- true => schedule builder must factor this in
  created_at timestamptz not null default now()
);

create index idx_support_plans_student on support_plans(student_id);
create index idx_accommodations_plan on accommodations(support_plan_id);

-- ----------------------------------------------------------------------------
-- ONLINE LEARNING TRACKING
-- ----------------------------------------------------------------------------

create table online_learning_records (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  requirement_met boolean not null default false,
  credits_earned_online numeric(4,2) default 0,
  provider text,                 -- 'FLVS', 'Dual Enrollment Online', 'Online Elective', 'Credit Recovery', 'EDGE Virtual'
  course_name text,
  school_year text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_online_learning_student on online_learning_records(student_id);

-- ----------------------------------------------------------------------------
-- GRADUATION REQUIREMENTS (reference data — editable by Admin, not hardcoded)
-- ----------------------------------------------------------------------------

create table graduation_requirements (
  id uuid primary key default uuid_generate_v4(),
  school_year text not null,           -- requirements can change year to year
  subject_area text not null,          -- 'English', 'Math', etc.
  credits_required numeric(3,2) not null,
  notes text,                          -- e.g. 'Must include Algebra I and Geometry'
  unique (school_year, subject_area)
);

create table best_standards (
  id uuid primary key default uuid_generate_v4(),
  grade_level grade_level not null,
  subject_area text not null,
  standard_code text not null,         -- e.g. 'MA.3.NSO.1.1'
  description text not null,
  unique (grade_level, standard_code)
);

create table student_standards_mastery (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  standard_id uuid not null references best_standards(id) on delete cascade,
  status text not null default 'not_assessed', -- 'mastered' | 'needs_intervention' | 'not_assessed'
  assessed_date date,
  unique (student_id, standard_id)
);

-- ----------------------------------------------------------------------------
-- STEAM PROGRAM
-- ----------------------------------------------------------------------------

create table steam_modules (
  id uuid primary key default uuid_generate_v4(),
  month text not null,            -- e.g. 'September'
  theme text not null,
  grade_band text not null,       -- e.g. 'K-2', '3-5', '6-8', '9-12'
  standards_linked uuid[],        -- array of best_standards ids
  description text,
  created_at timestamptz not null default now()
);

create table student_steam_assignments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  steam_module_id uuid not null references steam_modules(id) on delete cascade,
  completed boolean default false,
  school_year text not null
);

-- ----------------------------------------------------------------------------
-- EDGE PROGRAM
-- ----------------------------------------------------------------------------

create type edge_pathway as enum (
  'quickbooks_certification', 'entrepreneurship', 'financial_literacy', 'public_speaking',
  'leadership_development', 'workforce_readiness', 'career_exploration',
  'technology_certifications', 'trades_exploration', 'community_service',
  'business_ownership', 'college_career_readiness'
);

create table student_edge_pathways (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  pathway edge_pathway not null,
  status text not null default 'recommended', -- 'recommended' | 'selected' | 'in_progress' | 'completed'
  recommended_reason text,    -- why the system suggested it (interest/goal/strength match)
  selected_by uuid references staff_profiles(id),
  created_at timestamptz not null default now(),
  unique (student_id, pathway)
);

-- ----------------------------------------------------------------------------
-- SCHEDULES & PATHWAYS
-- ----------------------------------------------------------------------------

create type academic_pathway as enum (
  'standard', 'advanced_honors', 'intervention', 'credit_recovery', 'iep_support',
  '504_support', 'dual_enrollment', 'college_preparatory', 'edge_career', 'certification'
);

create type schedule_status as enum ('draft', 'pending_approval', 'approved', 'rejected');

create table schedules (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  school_year text not null,
  pathways academic_pathway[] not null default '{}',
  status schedule_status not null default 'draft',
  generated_by uuid references staff_profiles(id),  -- who built/submitted the draft
  approved_by uuid references staff_profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table schedule_blocks (
  id uuid primary key default uuid_generate_v4(),
  schedule_id uuid not null references schedules(id) on delete cascade,
  block_label text not null,        -- e.g. 'Period 1', 'Block A'
  course_name text not null,
  course_category text not null,    -- 'core' | 'honors' | 'intervention' | 'credit_recovery' | 'elective' | 'steam' | 'edge' | 'act_sat_prep' | 'online' | 'dual_enrollment'
  is_online boolean default false,
  notes text                        -- e.g. accommodation driving this placement
);

create index idx_schedules_student on schedules(student_id);
create index idx_schedule_blocks_schedule on schedule_blocks(schedule_id);

-- ----------------------------------------------------------------------------
-- AUDIT LOG
-- ----------------------------------------------------------------------------

create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid references staff_profiles(id),
  student_id uuid references students(id) on delete set null,
  action text not null,         -- e.g. 'update', 'create', 'delete', 'approve_schedule'
  table_name text not null,
  record_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_student on audit_log(student_id);
create index idx_audit_log_created on audit_log(created_at);
