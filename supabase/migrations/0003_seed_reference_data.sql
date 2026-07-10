-- ============================================================================
-- Seed reference data
-- Florida 24-credit standard diploma requirements (verify/update annually —
-- this is editable reference data, not hardcoded logic, so Admins can adjust
-- it in-app as state requirements change).
-- ============================================================================

insert into graduation_requirements (school_year, subject_area, credits_required, notes) values
  ('2026-2027', 'English/Language Arts', 4.0, 'Must include credits with major emphasis on literature, composition, and technical reading/writing'),
  ('2026-2027', 'Mathematics', 4.0, 'Must include Algebra I and Geometry; one credit may be substituted with a relevant CTE course'),
  ('2026-2027', 'Science', 3.0, 'Must include Biology I and two equally rigorous courses; at least one with a lab'),
  ('2026-2027', 'Social Studies', 3.0, 'World History (1.0), U.S. History (1.0), Economics (0.5), U.S. Government (0.5)'),
  ('2026-2027', 'Physical Education', 1.0, 'Must include integration of health'),
  ('2026-2027', 'Fine/Performing Arts, Speech, or Practical Arts', 1.0, NULL),
  ('2026-2027', 'World Language', 2.0, 'Two credits in the same world language (not required for ACCEL/certain pathways — confirm per student)'),
  ('2026-2027', 'Electives', 8.0, NULL),
  ('2026-2027', 'Online Learning Requirement', 0.0, 'Not a separate credit category — at least one course must be completed via online learning per Florida statute; tracked via online_learning_records, not a credit total')
on conflict (school_year, subject_area) do nothing;

-- Starter EDGE pathway recommendation logic notes (used by app-layer matching,
-- not enforced in SQL) are documented in lib/recommendations/edge.ts.

-- Starter STEAM modules — replace/expand with your school's actual monthly themes.
insert into steam_modules (month, theme, grade_band, description) values
  ('September', 'Engineering & Structures', 'K-2', 'Intro building/engineering challenges tied to early science standards'),
  ('September', 'Engineering & Structures', '3-5', 'Bridge-building and structural design tied to physical science standards'),
  ('September', 'Engineering & Structures', '6-8', 'Structural engineering design challenge with math/physics tie-in'),
  ('September', 'Engineering & Structures', '9-12', 'Applied engineering project tied to physics/pre-calc standards'),
  ('October', 'Earth & Space Systems', 'K-2', NULL),
  ('October', 'Earth & Space Systems', '3-5', NULL),
  ('October', 'Earth & Space Systems', '6-8', NULL),
  ('October', 'Earth & Space Systems', '9-12', NULL)
on conflict do nothing;
