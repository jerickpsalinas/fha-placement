-- ============================================================================
-- Private storage bucket for IEP/504 PDF documents
-- ============================================================================

-- Create the private bucket (not public — signed URLs required for download)
insert into storage.buckets (id, name, public)
values ('iep-504-documents', 'iep-504-documents', false)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Storage RLS policies
-- Only admin and counselor roles may upload, download, or delete.
-- ----------------------------------------------------------------------------

-- Upload (INSERT)
create policy "admin/counselor can upload iep-504 documents"
  on storage.objects for insert
  with check (
    bucket_id = 'iep-504-documents'
    and current_staff_role() in ('admin', 'counselor')
  );

-- Download (SELECT — used when generating signed URLs server-side)
create policy "admin/counselor can read iep-504 documents"
  on storage.objects for select
  using (
    bucket_id = 'iep-504-documents'
    and current_staff_role() in ('admin', 'counselor')
  );

-- Replace/overwrite (UPDATE)
create policy "admin/counselor can update iep-504 documents"
  on storage.objects for update
  using (
    bucket_id = 'iep-504-documents'
    and current_staff_role() in ('admin', 'counselor')
  );

-- Delete
create policy "admin/counselor can delete iep-504 documents"
  on storage.objects for delete
  using (
    bucket_id = 'iep-504-documents'
    and current_staff_role() in ('admin', 'counselor')
  );
