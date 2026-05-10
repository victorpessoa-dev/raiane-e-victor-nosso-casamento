create extension if not exists pgcrypto;

create table if not exists public.project_owner (
  id boolean primary key default true check (id = true),
  owner_user_id uuid not null unique references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop table if exists public.admin_users cascade;

alter table public.media_uploads enable row level security;
alter table public.project_owner enable row level security;

alter table public.media_uploads
  add column if not exists owner_user_id uuid references auth.users (id) on delete restrict;

alter table public.media_uploads
  add column if not exists is_visible boolean not null default true;

create or replace function public.current_project_owner_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select owner_user_id
  from public.project_owner
  where id = true
  limit 1
$$;

create or replace function public.assign_project_owner_to_media_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  configured_owner uuid;
begin
  configured_owner := public.current_project_owner_id();

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
execute function public.assign_project_owner_to_media_upload();

create index if not exists media_uploads_owner_created_at_idx
  on public.media_uploads (owner_user_id, created_at desc);

drop policy if exists "Anyone can insert media uploads" on public.media_uploads;
drop policy if exists "Anyone can select media uploads" on public.media_uploads;
drop policy if exists "Service role can delete media uploads" on public.media_uploads;
drop policy if exists "Service role manages media uploads" on public.media_uploads;
drop policy if exists "Public can upload pending media" on public.media_uploads;
drop policy if exists "Public can view visible media" on public.media_uploads;
drop policy if exists "Admins can manage media uploads" on public.media_uploads;
drop policy if exists "Owner can manage own media uploads" on public.media_uploads;

create policy "Public can upload pending media"
  on public.media_uploads
  for insert
  to anon, authenticated
  with check (is_visible = true);

create policy "Public can view visible media"
  on public.media_uploads
  for select
  to anon, authenticated
  using (is_visible = true);

create policy "Owner can manage own media uploads"
  on public.media_uploads
  for all
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "Owner can view project owner config" on public.project_owner;

create policy "Owner can view project owner config"
  on public.project_owner
  for select
  to authenticated
  using (owner_user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('wedding-media', 'wedding-media', false)
on conflict (id) do update
set public = false;

drop policy if exists "Public can upload wedding media" on storage.objects;
drop policy if exists "Public can read wedding media" on storage.objects;
drop policy if exists "Service role can delete wedding media" on storage.objects;
drop policy if exists "Service role manages wedding media objects" on storage.objects;
drop policy if exists "Public can upload wedding media objects" on storage.objects;
drop policy if exists "Public can read visible wedding media objects" on storage.objects;
drop policy if exists "Admins can manage wedding media objects" on storage.objects;
drop policy if exists "Owner can manage wedding media objects" on storage.objects;
drop policy if exists "Public can cleanup orphan wedding media objects" on storage.objects;

create policy "Public can upload wedding media objects"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'wedding-media');

create policy "Public can read visible wedding media objects"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'wedding-media'
    and exists (
      select 1
      from public.media_uploads media
      where media.storage_path = name
        and media.is_visible = true
    )
  );

create policy "Owner can manage wedding media objects"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'wedding-media'
    and public.current_project_owner_id() = auth.uid()
  )
  with check (
    bucket_id = 'wedding-media'
    and public.current_project_owner_id() = auth.uid()
  );

create policy "Public can cleanup orphan wedding media objects"
  on storage.objects
  for delete
  to anon, authenticated
  using (
    bucket_id = 'wedding-media'
    and not exists (
      select 1
      from public.media_uploads media
      where media.storage_path = name
    )
  );
