-- Corrects graduation_requirements to match the client-confirmed Florida
-- 24-credit standard diploma breakdown (BEST Standards aligned), per client
-- reply 2026-08-XX:
--   - World Language is NOT a graduation requirement (optional / college-
--     readiness indicator only) — removed as a required row.
--   - Personal Financial Literacy IS required (0.5 credit, standard FL diploma).
--   - Bible and STEAM are FHA institutional requirements, not part of the
--     Florida 24-credit count — they are tracked separately in the app
--     (see lib/audit/graduation.ts institutionalRequirements) rather than in
--     this table.
--   - "Fine/Performing Arts, Speech, or Practical Arts" renamed to
--     "Fine Arts/Practical Arts/CTE" to match the canonical subject_area
--     strings used across transcript import/parsing (lib/parsing/transcript.ts)
--     so credits are correctly matched by exact string equality.
--
-- Safe to wipe: no real student transcripts exist yet (test data was cleared
-- before client launch).
delete from graduation_requirements where school_year = '2026-2027';

insert into graduation_requirements (school_year, subject_area, credits_required, notes) values
  ('2026-2027', 'English/Language Arts', 4.0, 'Must include credits with major emphasis on literature, composition, and technical reading/writing'),
  ('2026-2027', 'Mathematics', 4.0, 'Must include Algebra I and Geometry; one credit may be substituted with a relevant CTE course'),
  ('2026-2027', 'Science', 3.0, 'Must include Biology I and two equally rigorous courses; at least one with a lab'),
  ('2026-2027', 'Social Studies', 3.0, 'World History (1.0), U.S. History (1.0), Economics (0.5), U.S. Government (0.5)'),
  ('2026-2027', 'Physical Education', 1.0, 'HOPE — Health Opportunities through Physical Education'),
  ('2026-2027', 'Fine Arts/Practical Arts/CTE', 1.0, NULL),
  ('2026-2027', 'Financial Literacy', 0.5, 'Personal Financial Literacy and Money Management — required for the standard FL diploma'),
  ('2026-2027', 'Electives', 7.5, 'Includes the online learning requirement — satisfied via any provider per FL Statute 1003.4282'),
  ('2026-2027', 'Online Learning Requirement', 0.0, 'Not a separate credit category — at least one course must be completed via online learning per Florida statute; tracked via online_learning_records, not a credit total')
on conflict (school_year, subject_area) do update set
  credits_required = excluded.credits_required,
  notes = excluded.notes;
