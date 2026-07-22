-- Adds `sports` to the public trainers mirror so Sports Coaches can list the
-- specific sports they coach, and clients can filter the listing down to a
-- sport.
--
-- The trainer's own draft (trainer_accounts.profile jsonb) carries `sports`
-- with no schema change; this only affects the published mirror. Publishing
-- degrades gracefully before this is applied (the upsert drops the unknown
-- column and retries), so the sports facet simply stays empty until the column
-- exists.
--
-- Note: as of this migration, `trainers.specialties` now carries the raw search
-- category ids (e.g. {gym,sport}) that power the category filter, while the
-- trainer's free-text specialties continue to live in `trainers.tags`. No DDL
-- was needed for that change — the column type is unchanged.

alter table public.trainers
  add column if not exists sports text[] not null default '{}';
