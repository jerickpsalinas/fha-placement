-- ============================================================================
-- Row-Level Security
-- Enforces role-based permissions at the database level, so access control
-- holds even if application code has a bug.
-- ============================================================================

-- Helper: get the calling user's role from staff_profiles.
create or replace function current_staff_role()
returns staff_role
language sql security definer stable
as $$
  select role from staff_profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean language sql security definer stable
as $$ select current_staff_role() = 'admin'; $$;

create or replace function is_assigned_to_student(target_student_id uuid)
returns boolean language sql security definer stable
as $$
  select exists (
    select 1 from staff_student_assignments
    where staff_id = auth.uid() and student_id = target_student_id
  );
$$;

-- ----------------------------------------------------------------------------
-- staff_profiles: staff can see their own row; admins see all.
-- ----------------------------------------------------------------------------
alter table staff_profiles enable row level security;

create policy "staff can view own profile" on staff_profiles
  for select using (id = auth.uid() or is_admin());

create policy "admin manages staff profiles" on staff_profiles
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- staff_student_assignments: admins manage; staff can see their own.
-- ----------------------------------------------------------------------------
alter table staff_student_assignments enable row level security;

create policy "view own assignments" on staff_student_assignments
  for select using (staff_id = auth.uid() or is_admin());

create policy "admin manages assignments" on staff_student_assignments
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- students: admins/counselors see assigned students; teachers see assigned
-- students with academic-only visibility (enforced at query layer for field
-- subsetting; row visibility enforced here). Read-only sees basic info only
-- (enforced at the application layer via a restricted view — see below).
-- ----------------------------------------------------------------------------
alter table students enable row level security;

create policy "admin full access to students" on students
  for all using (is_admin()) with check (is_admin());

create policy "counselor/teacher view assigned students" on students
  for select using (
    current_staff_role() in ('counselor','teacher','read_only')
    and is_assigned_to_student(id)
  );

create policy "counselor edits assigned students" on students
  for update using (
    current_staff_role() = 'counselor' and is_assigned_to_student(id)
  );

create policy "counselor inserts students" on students
  for insert with check (current_staff_role() in ('admin','counselor'));

-- ----------------------------------------------------------------------------
-- test_scores, transcript_entries, online_learning_records:
-- visible to admin + assigned counselor/teacher; editable by admin/counselor.
-- ----------------------------------------------------------------------------
alter table test_scores enable row level security;
alter table transcript_entries enable row level security;
alter table online_learning_records enable row level security;

create policy "view test_scores if assigned or admin" on test_scores
  for select using (is_admin() or is_assigned_to_student(student_id));
create policy "edit test_scores if admin or counselor assigned" on test_scores
  for insert with check (is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id)));
create policy "update test_scores if admin or counselor assigned" on test_scores
  for update using (is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id)));

create policy "view transcript if assigned or admin" on transcript_entries
  for select using (is_admin() or is_assigned_to_student(student_id));
create policy "edit transcript if admin or counselor assigned" on transcript_entries
  for insert with check (is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id)));
create policy "update transcript if admin or counselor assigned" on transcript_entries
  for update using (is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id)));

create policy "view online_learning if assigned or admin" on online_learning_records
  for select using (is_admin() or is_assigned_to_student(student_id));
create policy "edit online_learning if admin or counselor assigned" on online_learning_records
  for insert with check (is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id)));
create policy "update online_learning if admin or counselor assigned" on online_learning_records
  for update using (is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id)));

-- ----------------------------------------------------------------------------
-- support_plans + accommodations (IEP/504): the most sensitive tables.
-- Restricted to admin and counselor ONLY by default. Teachers do not get
-- direct table access here — they read accommodation summaries through the
-- `teacher_accommodation_view` below, which exposes instructional impact
-- without exposing full plan documents or notes.
-- ----------------------------------------------------------------------------
alter table support_plans enable row level security;
alter table accommodations enable row level security;

create policy "admin/counselor view support_plans" on support_plans
  for select using (
    is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id))
  );
create policy "admin/counselor manage support_plans" on support_plans
  for all using (
    is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id))
  ) with check (
    is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id))
  );

create policy "admin/counselor view accommodations" on accommodations
  for select using (
    is_admin() or exists (
      select 1 from support_plans sp
      where sp.id = support_plan_id
      and current_staff_role() = 'counselor'
      and is_assigned_to_student(sp.student_id)
    )
  );
create policy "admin/counselor manage accommodations" on accommodations
  for all using (
    is_admin() or exists (
      select 1 from support_plans sp
      where sp.id = support_plan_id
      and current_staff_role() = 'counselor'
      and is_assigned_to_student(sp.student_id)
    )
  );

-- Restricted view for teachers: instructional/scheduling impact only, no
-- raw notes or documents. Grant select on this view to authenticated role.
create or replace view teacher_accommodation_view as
  select
    sp.student_id,
    a.category,
    a.description,
    a.affects_scheduling
  from accommodations a
  join support_plans sp on sp.id = a.support_plan_id
  where a.category in ('instructional','testing','scheduling','environmental');

alter view teacher_accommodation_view set (security_invoker = true);

-- IMPORTANT: Postgres views run with the querying user's own RLS context when
-- security_invoker is true (as set above). Since the underlying support_plans
-- and accommodations tables are locked to admin/counselor only, a teacher
-- querying this view directly will get zero rows — by design. Teacher access
-- to accommodation summaries is provided instead through a dedicated RPC
-- function (see below) that runs as security definer and explicitly checks
-- the teacher's assignment before returning rows.

create or replace function get_teacher_accommodation_summary(target_student_id uuid)
returns table (category accommodation_category, description text, affects_scheduling boolean)
language plpgsql security definer
as $$
begin
  if current_staff_role() not in ('teacher','counselor','admin') then
    raise exception 'Not authorized.';
  end if;
  if current_staff_role() = 'teacher' and not is_assigned_to_student(target_student_id) then
    raise exception 'Not assigned to this student.';
  end if;
  return query
    select a.category, a.description, a.affects_scheduling
    from accommodations a
    join support_plans sp on sp.id = a.support_plan_id
    where sp.student_id = target_student_id
    and a.category in ('instructional','testing','scheduling','environmental');
end;
$$;

-- ----------------------------------------------------------------------------
-- graduation_requirements, best_standards, steam_modules: reference data.
-- Readable by all staff; editable by admin only.
-- ----------------------------------------------------------------------------
alter table graduation_requirements enable row level security;
alter table best_standards enable row level security;
alter table steam_modules enable row level security;

create policy "all staff read graduation_requirements" on graduation_requirements
  for select using (auth.uid() is not null);
create policy "admin edits graduation_requirements" on graduation_requirements
  for all using (is_admin()) with check (is_admin());

create policy "all staff read best_standards" on best_standards
  for select using (auth.uid() is not null);
create policy "admin edits best_standards" on best_standards
  for all using (is_admin()) with check (is_admin());

create policy "all staff read steam_modules" on steam_modules
  for select using (auth.uid() is not null);
create policy "admin edits steam_modules" on steam_modules
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- student_standards_mastery, student_steam_assignments, student_edge_pathways:
-- same visibility pattern as academic records.
-- ----------------------------------------------------------------------------
alter table student_standards_mastery enable row level security;
alter table student_steam_assignments enable row level security;
alter table student_edge_pathways enable row level security;

create policy "view mastery if assigned or admin" on student_standards_mastery
  for select using (is_admin() or is_assigned_to_student(student_id));
create policy "edit mastery if admin or counselor/teacher assigned" on student_standards_mastery
  for all using (is_admin() or (current_staff_role() in ('counselor','teacher') and is_assigned_to_student(student_id)));

create policy "view steam if assigned or admin" on student_steam_assignments
  for select using (is_admin() or is_assigned_to_student(student_id));
create policy "edit steam if admin or counselor/teacher assigned" on student_steam_assignments
  for all using (is_admin() or (current_staff_role() in ('counselor','teacher') and is_assigned_to_student(student_id)));

create policy "view edge if assigned or admin" on student_edge_pathways
  for select using (is_admin() or is_assigned_to_student(student_id));
create policy "edit edge if admin or counselor assigned" on student_edge_pathways
  for all using (is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id)));

-- ----------------------------------------------------------------------------
-- schedules + schedule_blocks: counselors create/edit drafts; only admins
-- can approve (enforced additionally in application logic on the status
-- transition, since RLS alone can't easily express "only admin can set this
-- specific field to this specific value" without a trigger).
-- ----------------------------------------------------------------------------
alter table schedules enable row level security;
alter table schedule_blocks enable row level security;

create policy "view schedules if assigned or admin" on schedules
  for select using (is_admin() or is_assigned_to_student(student_id));
create policy "counselor creates/edits draft schedules" on schedules
  for insert with check (is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id)));
create policy "counselor updates own draft, admin updates any" on schedules
  for update using (
    is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(student_id) and status in ('draft','pending_approval'))
  );

create policy "view schedule_blocks if can view schedule" on schedule_blocks
  for select using (
    exists (select 1 from schedules s where s.id = schedule_id and (is_admin() or is_assigned_to_student(s.student_id)))
  );
create policy "edit schedule_blocks if can edit schedule" on schedule_blocks
  for all using (
    exists (
      select 1 from schedules s where s.id = schedule_id
      and (is_admin() or (current_staff_role() = 'counselor' and is_assigned_to_student(s.student_id) and s.status in ('draft','pending_approval')))
    )
  );

-- Trigger: only admins may transition a schedule's status to 'approved'.
create or replace function enforce_approval_admin_only()
returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'approved' and OLD.status != 'approved' then
    if current_staff_role() != 'admin' then
      raise exception 'Only an administrator may approve a schedule.';
    end if;
    NEW.approved_by := auth.uid();
    NEW.approved_at := now();
  end if;
  return NEW;
end;
$$;

create trigger trg_enforce_approval
  before update on schedules
  for each row execute function enforce_approval_admin_only();

-- ----------------------------------------------------------------------------
-- audit_log: insert by any authenticated staff action (via triggers/app code);
-- read by admin only.
-- ----------------------------------------------------------------------------
alter table audit_log enable row level security;

create policy "admin reads audit_log" on audit_log
  for select using (is_admin());
create policy "any staff can write audit_log entries" on audit_log
  for insert with check (auth.uid() is not null);
