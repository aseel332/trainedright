-- Mirrors trainer_accounts.profile.gender onto the public trainers table so
-- clients can filter marketplace results by coach gender.

alter table public.trainers
  add column if not exists gender text not null default '';

alter table public.trainers
  drop constraint if exists trainers_gender_check;

alter table public.trainers
  add constraint trainers_gender_check
  check (gender in ('', 'female', 'male', 'non_binary', 'prefer_not_to_say'));

create index if not exists trainers_gender_idx
  on public.trainers (gender)
  where is_active;
