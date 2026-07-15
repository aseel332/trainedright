-- Publishing: connect a self-serve trainer_accounts row to the public
-- `trainers` row that the marketplace actually reads from.
--
-- Before this, admin approval only flipped trainer_accounts.approval_status,
-- so an approved trainer never appeared anywhere on the public site.

alter table public.trainers
  -- Null for the seeded demo trainers; set for every self-serve trainer that
  -- admin has published. Cascade so deleting the auth user removes the
  -- public profile too.
  add column if not exists user_id uuid unique references auth.users(id) on delete cascade;

-- The original marketplace migration declared whatsapp_number, but the live
-- database predates it and `create table if not exists` never added it.
alter table public.trainers
  add column if not exists whatsapp_number text not null default '919876543210';

create index if not exists trainers_user_idx on public.trainers (user_id);
