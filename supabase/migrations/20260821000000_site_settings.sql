-- Admin-editable site content.
--
-- The landing page is assembled from real marketplace data (published
-- trainers, their verified reviews and confirmed transformations). This table
-- holds the small amount of *editorial* state that is not derivable from that
-- data: the hero/section copy, which trainers and proof to feature, and which
-- sections are switched on.
--
-- One row per surface, keyed by a stable text id ('home' today). The payload is
-- jsonb so new fields can be added from the app without another migration —
-- `lib/home-settings.ts` owns the shape and fills in defaults for anything
-- missing, so an old row never breaks a new deploy.

create table if not exists public.site_settings (
  id text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- Seed the home row so the admin console always has something to edit.
-- '{}' is a valid payload: every field falls back to the app's defaults.
insert into public.site_settings (id, content)
values ('home', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- Read-only for the public site. Writes go through the admin console, which
-- uses the service-role key and bypasses RLS — there is deliberately no
-- insert/update/delete policy for anon or authenticated.
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

grant usage on schema public to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
