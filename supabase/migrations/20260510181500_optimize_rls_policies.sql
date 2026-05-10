drop policy if exists "Owner can manage own media uploads" on public.media_uploads;
drop policy if exists "Owner can update own media uploads" on public.media_uploads;
drop policy if exists "Owner can delete own media uploads" on public.media_uploads;

create policy "Owner can update own media uploads"
  on public.media_uploads
  for update
  to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy "Owner can delete own media uploads"
  on public.media_uploads
  for delete
  to authenticated
  using (owner_user_id = (select auth.uid()));

drop policy if exists "Owner can view project owner config" on public.project_owner;

create policy "Owner can view project owner config"
  on public.project_owner
  for select
  to authenticated
  using (owner_user_id = (select auth.uid()));

drop policy if exists "Owner can manage wedding media objects" on storage.objects;

create policy "Owner can manage wedding media objects"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'wedding-media'
    and private.current_project_owner_id() = (select auth.uid())
  )
  with check (
    bucket_id = 'wedding-media'
    and private.current_project_owner_id() = (select auth.uid())
  );
