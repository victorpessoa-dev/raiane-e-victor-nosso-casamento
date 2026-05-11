create schema if not exists private;

create or replace function private.current_project_owner_id()
returns uuid
language sql
security definer
set search_path = public, private
stable
as $$
  select owner_user_id
  from public.project_owner
  where id = true
  limit 1
$$;

create or replace function private.assign_project_owner_to_media_upload()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  configured_owner uuid;
begin
  configured_owner := private.current_project_owner_id();

  if configured_owner is null then
    raise exception 'Project owner not configured.';
  end if;

  new.owner_user_id := configured_owner;
  new.is_visible := coalesce(new.is_visible, true);

  return new;
end;
$$;

drop trigger if exists set_project_owner_on_media_uploads on public.media_uploads;

create trigger set_project_owner_on_media_uploads
before insert on public.media_uploads
for each row
execute function private.assign_project_owner_to_media_upload();

grant usage on schema private to authenticated;
grant execute on function private.current_project_owner_id() to authenticated;

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

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'current_project_owner_id'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke all on function public.current_project_owner_id() from public;
    revoke all on function public.current_project_owner_id() from anon;
    revoke all on function public.current_project_owner_id() from authenticated;
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'assign_project_owner_to_media_upload'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke all on function public.assign_project_owner_to_media_upload() from public;
    revoke all on function public.assign_project_owner_to_media_upload() from anon;
    revoke all on function public.assign_project_owner_to_media_upload() from authenticated;
  end if;
end $$;

drop function if exists public.assign_project_owner_to_media_upload();
drop function if exists public.current_project_owner_id();
