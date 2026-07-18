-- Adds `state` to the public trainers mirror so listing cards can show
-- "City, State" instead of a free-text area/neighbourhood.
--
-- The trainer's own draft (trainer_accounts.profile jsonb) already carries
-- `state` with no schema change; this only affects the published mirror.
-- The `area` column is left in place (used by trainer_locations semantics and
-- kept for backward compatibility) but is no longer written from the profile.

alter table public.trainers
  add column if not exists state text not null default '';

-- Backfill state from the known city -> state mapping for already-published
-- trainers, so existing cards get a state without needing a re-publish.
update public.trainers
set state = case city
  when 'Mumbai' then 'Maharashtra'
  when 'Delhi' then 'Delhi'
  when 'Bengaluru' then 'Karnataka'
  when 'Pune' then 'Maharashtra'
  when 'Hyderabad' then 'Telangana'
  when 'Chennai' then 'Tamil Nadu'
  when 'Kolkata' then 'West Bengal'
  when 'Ahmedabad' then 'Gujarat'
  when 'Jaipur' then 'Rajasthan'
  when 'Chandigarh' then 'Chandigarh'
  else state
end
where coalesce(state, '') = '';
