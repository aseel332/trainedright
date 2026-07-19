-- The "Verified coach" badge/status was removed from the product. Trainers no
-- longer carry a verified flag (the app stopped reading or writing it), so drop
-- the column. Review and credential verification are unaffected — those live on
-- trainer_reviews.is_verified and trainer_credentials.is_verified.

alter table public.trainers
  drop column if exists is_verified;
