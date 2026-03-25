-- Storage bucket for load documents (BOL, rate confirmation, POD)
-- File path structure: {org_id}/{load_id}/{doc_type}.{ext}
-- RLS scoped by org_id extracted from folder path

-- Create private storage bucket
insert into storage.buckets (id, name, public)
values ('load-documents', 'load-documents', false);

-- RLS: insert documents scoped by org_id
create policy "load_documents_insert" on storage.objects
  for insert with check (
    bucket_id = 'load-documents'
    and (storage.foldername(name))[1] = (select auth.org_id())::text
  );

-- RLS: select documents scoped by org_id
create policy "load_documents_select" on storage.objects
  for select using (
    bucket_id = 'load-documents'
    and (storage.foldername(name))[1] = (select auth.org_id())::text
  );

-- RLS: delete documents scoped by org_id
create policy "load_documents_delete" on storage.objects
  for delete using (
    bucket_id = 'load-documents'
    and (storage.foldername(name))[1] = (select auth.org_id())::text
  );
