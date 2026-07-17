-- Production cleanup + real demand analytics.
--
-- 1. Removes the demo seed rows the first migration inserted (fixed UUIDs,
--    never owned by a real account). Real trainers publish with user_id set
--    and generated ids, so they are untouched.
-- 2. Adds trainer_transformations.rating so the public site can show the
--    client's real star rating instead of an invented one.
-- 3. Adds trainer_events, the backing table for the dashboard's demand
--    analytics (profile views, WhatsApp clicks, trial requests, saves).
--    Events are written only by the server (service role) through
--    POST /api/track.
-- 4. Drops the anonymous RLS policies on review/transformation requests:
--    token links are now read and submitted server-side with explicit
--    token + status checks, so pending rows are no longer enumerable with
--    the public API key.

-- 1. Demo seed data ---------------------------------------------------------

delete from public.stories
where id::text like '70000000-0000-4000-8000-%';

delete from public.trainers
where user_id is null
  and id::text like '00000000-0000-4000-8000-%';

-- 2. Real transformation ratings -------------------------------------------

alter table public.trainer_transformations
  add column if not exists rating numeric(2,1)
    check (rating is null or (rating >= 1 and rating <= 5));

-- 3. Demand analytics events ------------------------------------------------

create table if not exists public.trainer_events (
  id bigint generated always as identity primary key,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  event_type text not null check (
    event_type in ('profile_view', 'whatsapp_click', 'trial_request', 'save', 'share')
  ),
  created_at timestamptz not null default now()
);

create index if not exists trainer_events_trainer_idx
  on public.trainer_events (trainer_id, event_type, created_at desc);

-- RLS on with no policies: only the service-role key (the /api/track route
-- and the dashboard aggregation) can touch events.
alter table public.trainer_events enable row level security;

-- 4. Token links are server-mediated now -------------------------------------

drop policy if exists "Anyone with link can read pending review" on public.review_requests;
drop policy if exists "Anyone with link can submit pending review" on public.review_requests;
drop policy if exists "Anyone with link can read pending transformation" on public.transformation_requests;
drop policy if exists "Anyone with link can submit pending transformation" on public.transformation_requests;
