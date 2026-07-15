-- ============================================================================
-- Add "director" role with identical permissions to "admin".
-- ============================================================================

-- 1. Extend the enum (cannot remove or reorder values, only append).
alter type staff_role add value if not exists 'director';

-- 2. Update is_admin() so every RLS policy that calls it automatically covers
--    director without touching the individual policies.
create or replace function is_admin()
returns boolean language sql security definer stable
as $$ select current_staff_role() in ('admin', 'director'); $$;

-- 3. Update the schedule-approval trigger to allow director as well.
create or replace function enforce_approval_admin_only()
returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'approved' and OLD.status != 'approved' then
    if current_staff_role() not in ('admin', 'director') then
      raise exception 'Only an administrator may approve a schedule.';
    end if;
    NEW.approved_by := auth.uid();
    NEW.approved_at := now();
  end if;
  return NEW;
end;
$$;

-- 4. Update get_teacher_accommodation_summary to include director.
create or replace function get_teacher_accommodation_summary(target_student_id uuid)
returns table (category accommodation_category, description text, affects_scheduling boolean)
language plpgsql security definer
as $$
begin
  if current_staff_role() not in ('teacher', 'counselor', 'admin', 'director') then
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
    and a.category in ('instructional', 'testing', 'scheduling', 'environmental');
end;
$$;
