-- Social profile links shown on the public trainer detail page.
-- Stored as the raw handle or URL the trainer entered; the app normalizes
-- them to full links at display time (lib/socials.ts).

alter table public.trainers
  add column if not exists instagram text not null default '',
  add column if not exists x text not null default '',
  add column if not exists youtube text not null default '';
