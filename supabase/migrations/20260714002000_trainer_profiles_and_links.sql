-- Trainer self-serve profiles, review links, transformation links, uploads.

alter table public.trainer_accounts
  add column if not exists profile jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists submitted_at timestamptz;

-- ---------------------------------------------------------------------------
-- Review requests: one row per review. The row id doubles as the share token.
-- source 'client_link'  -> client fills rating/text via /review/[id] (verified)
-- source 'trainer'      -> trainer added it themselves with consent (unverified)
-- ---------------------------------------------------------------------------
create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  trainer_user_id uuid not null references auth.users(id) on delete cascade,
  trainer_display_name text not null default '',
  client_name text not null,
  source text not null default 'client_link'
    check (source in ('client_link', 'trainer')),
  status text not null default 'pending'
    check (status in ('pending', 'submitted')),
  rating numeric(2,1) check (rating is null or (rating >= 1 and rating <= 5)),
  review_text text not null default '',
  consent_confirmed boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists review_requests_trainer_idx
  on public.review_requests (trainer_user_id, created_at desc);

alter table public.review_requests enable row level security;

drop policy if exists "Trainers manage own review requests" on public.review_requests;
create policy "Trainers manage own review requests"
on public.review_requests
for all
to authenticated
using (auth.uid() = trainer_user_id)
with check (auth.uid() = trainer_user_id);

-- A client holding the link (the uuid) can read the pending request to render
-- the form, and can submit it exactly once.
drop policy if exists "Anyone with link can read pending review" on public.review_requests;
create policy "Anyone with link can read pending review"
on public.review_requests
for select
to anon
using (status = 'pending');

drop policy if exists "Anyone with link can submit pending review" on public.review_requests;
create policy "Anyone with link can submit pending review"
on public.review_requests
for update
to anon
using (status = 'pending' and source = 'client_link')
with check (status = 'submitted');

-- ---------------------------------------------------------------------------
-- Transformation requests: the row id doubles as the share token.
-- mode 'client_all'     -> client submits photos + story + rating themselves
-- mode 'trainer_photos' -> trainer supplied photos/result; client rates/reviews
-- ---------------------------------------------------------------------------
create table if not exists public.transformation_requests (
  id uuid primary key default gen_random_uuid(),
  trainer_user_id uuid not null references auth.users(id) on delete cascade,
  trainer_display_name text not null default '',
  mode text not null default 'client_all'
    check (mode in ('client_all', 'trainer_photos')),
  client_name text not null default '',
  title text not null default '',
  result_label text not null default '',
  duration_label text not null default '',
  before_image_url text not null default '',
  after_image_url text not null default '',
  rating numeric(2,1) check (rating is null or (rating >= 1 and rating <= 5)),
  review_text text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists transformation_requests_trainer_idx
  on public.transformation_requests (trainer_user_id, created_at desc);

alter table public.transformation_requests enable row level security;

drop policy if exists "Trainers manage own transformation requests" on public.transformation_requests;
create policy "Trainers manage own transformation requests"
on public.transformation_requests
for all
to authenticated
using (auth.uid() = trainer_user_id)
with check (auth.uid() = trainer_user_id);

drop policy if exists "Anyone with link can read pending transformation" on public.transformation_requests;
create policy "Anyone with link can read pending transformation"
on public.transformation_requests
for select
to anon
using (status = 'pending');

drop policy if exists "Anyone with link can submit pending transformation" on public.transformation_requests;
create policy "Anyone with link can submit pending transformation"
on public.transformation_requests
for update
to anon
using (status = 'pending')
with check (status = 'submitted');

grant select, insert, update, delete on
  public.review_requests,
  public.transformation_requests
to authenticated;
grant select, update on
  public.review_requests,
  public.transformation_requests
to anon;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for trainer uploads (avatars, covers, gallery,
-- credentials, transformation photos).
--   <auth uid>/...      -> written by the signed-in trainer
--   submissions/...     -> written by anonymous clients via share links
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('trainer-uploads', 'trainer-uploads', true)
on conflict (id) do nothing;

drop policy if exists "Public read trainer uploads" on storage.objects;
create policy "Public read trainer uploads"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'trainer-uploads');

drop policy if exists "Trainers write own upload folder" on storage.objects;
create policy "Trainers write own upload folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'trainer-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Trainers update own upload folder" on storage.objects;
create policy "Trainers update own upload folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'trainer-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Trainers delete own upload folder" on storage.objects;
create policy "Trainers delete own upload folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'trainer-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Clients upload link submissions" on storage.objects;
create policy "Clients upload link submissions"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'trainer-uploads'
  and (storage.foldername(name))[1] = 'submissions'
);
