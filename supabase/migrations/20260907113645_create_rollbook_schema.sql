begin;

-- Every record belongs to exactly one authenticated athlete.  The application
-- can therefore use the public API without ever exposing another athlete's
-- training or competition history.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  username text unique,
  belt_rank text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_]{3,30}$')
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  year smallint not null check (year between 2000 and 2100),
  starts_on date,
  ends_on date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_dates check (ends_on is null or starts_on is null or ends_on >= starts_on),
  constraint seasons_owner_year_unique unique (owner_id, year)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  season_id uuid references public.seasons (id) on delete set null,
  name text not null,
  organizer text,
  source_url text,
  starts_on date not null,
  ends_on date,
  city text,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  division text,
  weight_class text,
  ruleset text,
  medal text check (medal is null or medal in ('gold', 'silver', 'bronze')),
  placement smallint check (placement is null or placement > 0),
  overall_score numeric(3,1) check (overall_score is null or overall_score between 0 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitions_dates check (ends_on is null or ends_on >= starts_on)
);

create table public.techniques (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text not null check (category in ('submission', 'takedown', 'sweep', 'pass', 'position', 'other')),
  created_at timestamptz not null default now(),
  constraint techniques_owner_name_unique unique (owner_id, name)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  competition_id uuid not null references public.competitions (id) on delete cascade,
  sequence_no smallint not null check (sequence_no > 0),
  opponent_name text,
  outcome text not null check (outcome in ('win', 'loss', 'draw', 'no_contest')),
  win_method text check (win_method is null or win_method in ('submission', 'points', 'decision', 'penalty', 'walkover', 'other')),
  result_detail text,
  points_for smallint check (points_for is null or points_for >= 0),
  points_against smallint check (points_against is null or points_against >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_competition_sequence_unique unique (competition_id, sequence_no)
);

create table public.match_techniques (
  match_id uuid not null references public.matches (id) on delete cascade,
  technique_id uuid not null references public.techniques (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('finish', 'attempt', 'scored', 'conceded')),
  created_at timestamptz not null default now(),
  primary key (match_id, technique_id, role)
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  season_id uuid references public.seasons (id) on delete set null,
  trained_on date not null default current_date,
  duration_minutes smallint check (duration_minutes is null or duration_minutes > 0),
  intensity smallint check (intensity is null or intensity between 1 and 10),
  focus text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index competitions_owner_starts_on_idx on public.competitions (owner_id, starts_on desc);
create index matches_owner_competition_idx on public.matches (owner_id, competition_id);
create index training_sessions_owner_trained_on_idx on public.training_sessions (owner_id, trained_on desc);
create index match_techniques_owner_idx on public.match_techniques (owner_id);

alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.competitions enable row level security;
alter table public.techniques enable row level security;
alter table public.matches enable row level security;
alter table public.match_techniques enable row level security;
alter table public.training_sessions enable row level security;

-- The API is deliberately private to signed-in users.  RLS below narrows that
-- access to each athlete's own rows and validates all cross-table relations.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;

create policy "profiles: athlete manages own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "seasons: athlete manages own rows" on public.seasons
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "competitions: athlete manages own rows" on public.competitions
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (season_id is null or exists (
      select 1 from public.seasons s where s.id = season_id and s.owner_id = (select auth.uid())
    ))
  );

create policy "techniques: athlete manages own rows" on public.techniques
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "matches: athlete manages own rows" on public.matches
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.competitions c where c.id = competition_id and c.owner_id = (select auth.uid())
    )
  );

create policy "match techniques: athlete manages own rows" on public.match_techniques
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.matches m where m.id = match_id and m.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.techniques t where t.id = technique_id and t.owner_id = (select auth.uid())
    )
  );

create policy "training sessions: athlete manages own rows" on public.training_sessions
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (season_id is null or exists (
      select 1 from public.seasons s where s.id = season_id and s.owner_id = (select auth.uid())
    ))
  );

commit;
