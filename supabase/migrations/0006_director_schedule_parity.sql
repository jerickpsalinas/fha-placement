-- ============================================================================
-- Director role parity with Admin
--
-- The Director role was added in 0005 and is described as "same permissions as
-- Admin", but the RLS helper is_admin() only matched the literal 'admin' role.
-- That silently locked Directors out of every admin-gated path — most visibly,
-- they could not create or approve schedules (the approval trigger below also
-- rejected them at the database level).
--
-- This widens is_admin() to cover 'director', which is the single source of
-- truth used by policies across all tables, and updates the schedule-approval
-- trigger to match.
-- ============================================================================

-- is_admin() is referenced by policies on nearly every table; widening it here
-- grants Director the same access as Admin everywhere consistently.
create or replace function is_admin()
returns boolean language sql security definer stable
as $$ select current_staff_role() in ('admin', 'director'); $$;

-- The approval trigger checked the role directly rather than via is_admin(),
-- so it needs the same widening to let Directors approve schedules.
create or replace function enforce_approval_admin_only()
returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'approved' and OLD.status != 'approved' then
    if current_staff_role() not in ('admin', 'director') then
      raise exception 'Only an administrator or director may approve a schedule.';
    end if;
    NEW.approved_by := auth.uid();
    NEW.approved_at := now();
  end if;
  return NEW;
end;
$$;
