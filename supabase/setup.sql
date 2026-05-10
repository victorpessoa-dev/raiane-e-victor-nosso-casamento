-- Setup completo do banco para o projeto "R & V - Nosso Casamento"
-- Execute no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create schema if not exists private;

create table if not exists public.media_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete restrict,
  file_name text not null default '',
  storage_path text not null default '',
  file_type text not null default 'image',
  mime_type text not null default '',
  file_size bigint not null default 0,
  uploader_name text not null default '',
  message text not null default '',
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.project_owner (
  id boolean primary key default true check (id = true),
  owner_user_id uuid not null unique references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop table if exists public.admin_users cascade;

alter table public.media_uploads enable row level security;
alter table public.project_owner enable row level security;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'media_uploads'
      and column_name = 'owner_user_id'
  ) then
    alter table public.media_uploads
      add column owner_user_id uuid references auth.users (id) on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'media_uploads_file_type_check'
  ) then
    alter table public.media_uploads
      add constraint media_uploads_file_type_check
      check (file_type in ('image', 'video'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'media_uploads_file_size_nonnegative_check'
  ) then
    alter table public.media_uploads
      add constraint media_uploads_file_size_nonnegative_check
      check (file_size >= 0);
  end if;
end $$;

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

revoke all on function private.current_project_owner_id() from public;
revoke all on function private.current_project_owner_id() from anon;
grant usage on schema private to authenticated;
grant execute on function private.current_project_owner_id() to authenticated;

revoke all on function public.current_project_owner_id() from public;
revoke all on function public.current_project_owner_id() from anon;
revoke all on function public.current_project_owner_id() from authenticated;

revoke all on function public.assign_project_owner_to_media_upload() from public;
revoke all on function public.assign_project_owner_to_media_upload() from anon;
revoke all on function public.assign_project_owner_to_media_upload() from authenticated;

drop function if exists public.assign_project_owner_to_media_upload();
drop function if exists public.current_project_owner_id();

create index if not exists media_uploads_created_at_idx
  on public.media_uploads (created_at desc);

create index if not exists media_uploads_visible_created_at_idx
  on public.media_uploads (is_visible, created_at desc);

create index if not exists media_uploads_owner_created_at_idx
  on public.media_uploads (owner_user_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('wedding-media', 'wedding-media', false)
on conflict (id) do update
set public = false;

drop policy if exists "Anyone can insert media uploads" on public.media_uploads;
drop policy if exists "Anyone can select media uploads" on public.media_uploads;
drop policy if exists "Service role can delete media uploads" on public.media_uploads;
drop policy if exists "Service role manages media uploads" on public.media_uploads;
drop policy if exists "Public can upload pending media" on public.media_uploads;
drop policy if exists "Public can view visible media" on public.media_uploads;
drop policy if exists "Admins can manage media uploads" on public.media_uploads;
drop policy if exists "Owner can manage own media uploads" on public.media_uploads;
drop policy if exists "Owner can update own media uploads" on public.media_uploads;
drop policy if exists "Owner can delete own media uploads" on public.media_uploads;

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
    and private.current_project_owner_id() = (select auth.uid())
  )
  with check (
    bucket_id = 'wedding-media'
    and private.current_project_owner_id() = (select auth.uid())
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
