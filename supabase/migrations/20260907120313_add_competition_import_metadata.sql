alter table public.competitions
  add column if not exists source_url text,
  add column if not exists cover_image_url text;
