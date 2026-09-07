-- The app deliberately loads media in a separate query while deployments catch
-- up, but the foreign key below restores the public API's discoverable join.
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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'competition_media_competition_id_fkey'
      and conrelid = 'public.competition_media'::regclass
  ) then
    alter table public.competition_media
      add constraint competition_media_competition_id_fkey
      foreign key (competition_id)
      references public.competitions (id)
      on delete cascade;
  end if;
end
$$;

create index if not exists competition_media_competition_idx
  on public.competition_media (competition_id, created_at);
