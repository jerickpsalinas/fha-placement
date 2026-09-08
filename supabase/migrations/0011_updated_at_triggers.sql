-- ============================================================================
-- Maintain updated_at automatically on the tables that carry it.
--
-- Previously updated_at was only ever set to its insert value (or set by hand
-- in a couple of code paths), so `schedules.updated_at` didn't reflect edits.
-- listPendingApprovals() orders by updated_at to show submission order, which
-- only works if updated_at actually moves on update. This adds a single shared
-- trigger function and wires it to every table with an updated_at column.
-- ============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_students_updated_at on students;
create trigger trg_students_updated_at
  before update on students
  for each row execute function set_updated_at();

drop trigger if exists trg_support_plans_updated_at on support_plans;
create trigger trg_support_plans_updated_at
  before update on support_plans
  for each row execute function set_updated_at();

-- schedules already has trg_enforce_approval (BEFORE UPDATE) which sets
-- approved_by/approved_at; this trigger complements it by keeping updated_at
-- current on every update regardless of the status transition.
drop trigger if exists trg_schedules_updated_at on schedules;
create trigger trg_schedules_updated_at
  before update on schedules
  for each row execute function set_updated_at();
