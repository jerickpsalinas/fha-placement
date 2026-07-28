-- Add per-subject placement level to schedule blocks.
-- Nullable so existing rows stay valid.
ALTER TABLE schedule_blocks
  ADD COLUMN IF NOT EXISTS placement_level text;

COMMENT ON COLUMN schedule_blocks.placement_level IS
  'Per-subject placement tier: intervention, on_level, advanced, whole_group, or null for non-academic blocks (e.g. lunch).';
