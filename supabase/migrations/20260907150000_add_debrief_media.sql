alter table public.competitions
  add column if not exists debrief_focus text;

create table if not exists public.competition_media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  competition_id uuid not null references public.competitions (id) on delete cascade,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists competition_media_competition_idx
  on public.competition_media (competition_id, created_at);

alter table public.competition_media enable row level security;
grant select, insert, update, delete on public.competition_media to authenticated;

create policy "competition media: athlete manages own rows" on public.competition_media
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.competitions c
      where c.id = competition_id and c.owner_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public)
values ('competition-media', 'competition-media', false)
on conflict (id) do nothing;

create policy "competition media: athlete reads own files" on storage.objects
  for select to authenticated
  using (bucket_id = 'competition-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "competition media: athlete uploads own files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'competition-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
