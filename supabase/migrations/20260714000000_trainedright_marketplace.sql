create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'trainer_badge'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.trainer_badge as enum ('award', 'verified', 'loved');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'trainer_media_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.trainer_media_type as enum ('photo', 'video');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'credential_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.credential_type as enum ('certified', 'id', 'medical', 'award');
  end if;
end $$;

create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  first_name text not null,
  city text not null default 'Bengaluru',
  area text not null default '',
  bio text not null,
  avatar_url text not null,
  card_image_url text not null,
  hero_image_url text not null,
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  years_experience integer not null default 0 check (years_experience >= 0),
  clients_count integer not null default 0 check (clients_count >= 0),
  reply_time_label text not null default '~24 hrs',
  price_from_inr integer not null default 0 check (price_from_inr >= 0),
  whatsapp_number text not null default '919876543210',
  specialties text[] not null default '{}',
  tags text[] not null default '{}',
  badges public.trainer_badge[] not null default '{}',
  testimonial text not null default '',
  is_verified boolean not null default false,
  is_active boolean not null default true,
  sort_rank integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_media (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  media_type public.trainer_media_type not null,
  url text not null,
  poster_url text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_pricing (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  name text not null,
  description text not null default '',
  price_inr integer check (price_inr is null or price_inr >= 0),
  unit text not null,
  badge text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_transformations (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  result_label text not null,
  duration_label text not null,
  before_image_url text not null,
  after_image_url text not null,
  client_name text not null,
  client_initials text not null,
  avatar_color text not null default '#F02D28',
  review text not null default '',
  is_confirmed boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_reviews (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  client_name text not null,
  client_initials text not null,
  avatar_color text not null default '#F02D28',
  rating numeric(2,1) not null check (rating >= 0 and rating <= 5),
  review_text text not null,
  when_label text not null default '',
  is_verified boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_locations (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  name text not null,
  area text not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_credentials (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  title text not null,
  subtitle text not null,
  credential_type public.credential_type not null,
  is_verified boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainers(id) on delete set null,
  title text not null,
  author_name text not null,
  excerpt text not null,
  image_url text not null,
  avatar_url text not null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trainers_active_sort_idx on public.trainers (is_active, sort_rank);
create index if not exists trainers_city_idx on public.trainers (city);
create index if not exists trainers_specialties_gin_idx on public.trainers using gin (specialties);
create index if not exists trainers_tags_gin_idx on public.trainers using gin (tags);
create index if not exists trainer_media_trainer_idx on public.trainer_media (trainer_id, sort_order);
create index if not exists trainer_pricing_trainer_idx on public.trainer_pricing (trainer_id, sort_order);
create index if not exists trainer_transformations_trainer_idx on public.trainer_transformations (trainer_id, sort_order);
create index if not exists trainer_reviews_trainer_idx on public.trainer_reviews (trainer_id, sort_order);
create index if not exists trainer_locations_trainer_idx on public.trainer_locations (trainer_id, sort_order);
create index if not exists trainer_credentials_trainer_idx on public.trainer_credentials (trainer_id, sort_order);
create index if not exists stories_featured_idx on public.stories (is_active, is_featured, sort_order);
create index if not exists stories_trainer_idx on public.stories (trainer_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_trainers_updated_at on public.trainers;
create trigger set_trainers_updated_at
before update on public.trainers
for each row execute function public.set_updated_at();

drop trigger if exists set_trainer_media_updated_at on public.trainer_media;
create trigger set_trainer_media_updated_at
before update on public.trainer_media
for each row execute function public.set_updated_at();

drop trigger if exists set_trainer_pricing_updated_at on public.trainer_pricing;
create trigger set_trainer_pricing_updated_at
before update on public.trainer_pricing
for each row execute function public.set_updated_at();

drop trigger if exists set_trainer_transformations_updated_at on public.trainer_transformations;
create trigger set_trainer_transformations_updated_at
before update on public.trainer_transformations
for each row execute function public.set_updated_at();

drop trigger if exists set_trainer_reviews_updated_at on public.trainer_reviews;
create trigger set_trainer_reviews_updated_at
before update on public.trainer_reviews
for each row execute function public.set_updated_at();

drop trigger if exists set_trainer_locations_updated_at on public.trainer_locations;
create trigger set_trainer_locations_updated_at
before update on public.trainer_locations
for each row execute function public.set_updated_at();

drop trigger if exists set_trainer_credentials_updated_at on public.trainer_credentials;
create trigger set_trainer_credentials_updated_at
before update on public.trainer_credentials
for each row execute function public.set_updated_at();

drop trigger if exists set_stories_updated_at on public.stories;
create trigger set_stories_updated_at
before update on public.stories
for each row execute function public.set_updated_at();

alter table public.trainers enable row level security;
alter table public.trainer_media enable row level security;
alter table public.trainer_pricing enable row level security;
alter table public.trainer_transformations enable row level security;
alter table public.trainer_reviews enable row level security;
alter table public.trainer_locations enable row level security;
alter table public.trainer_credentials enable row level security;
alter table public.stories enable row level security;

drop policy if exists "Public can read active trainers" on public.trainers;
create policy "Public can read active trainers"
on public.trainers
for select
to anon, authenticated
using (is_active);

drop policy if exists "Public can read media for active trainers" on public.trainer_media;
create policy "Public can read media for active trainers"
on public.trainer_media
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trainers t
    where t.id = trainer_media.trainer_id and t.is_active
  )
);

drop policy if exists "Public can read pricing for active trainers" on public.trainer_pricing;
create policy "Public can read pricing for active trainers"
on public.trainer_pricing
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trainers t
    where t.id = trainer_pricing.trainer_id and t.is_active
  )
);

drop policy if exists "Public can read transformations for active trainers" on public.trainer_transformations;
create policy "Public can read transformations for active trainers"
on public.trainer_transformations
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trainers t
    where t.id = trainer_transformations.trainer_id and t.is_active
  )
);

drop policy if exists "Public can read reviews for active trainers" on public.trainer_reviews;
create policy "Public can read reviews for active trainers"
on public.trainer_reviews
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trainers t
    where t.id = trainer_reviews.trainer_id and t.is_active
  )
);

drop policy if exists "Public can read locations for active trainers" on public.trainer_locations;
create policy "Public can read locations for active trainers"
on public.trainer_locations
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trainers t
    where t.id = trainer_locations.trainer_id and t.is_active
  )
);

drop policy if exists "Public can read credentials for active trainers" on public.trainer_credentials;
create policy "Public can read credentials for active trainers"
on public.trainer_credentials
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trainers t
    where t.id = trainer_credentials.trainer_id and t.is_active
  )
);

drop policy if exists "Public can read active stories" on public.stories;
create policy "Public can read active stories"
on public.stories
for select
to anon, authenticated
using (
  is_active and (
    trainer_id is null or exists (
      select 1 from public.trainers t
      where t.id = stories.trainer_id and t.is_active
    )
  )
);

grant usage on schema public to anon, authenticated;
grant select on
  public.trainers,
  public.trainer_media,
  public.trainer_pricing,
  public.trainer_transformations,
  public.trainer_reviews,
  public.trainer_locations,
  public.trainer_credentials,
  public.stories
to anon, authenticated;

insert into public.trainers (
  id, slug, name, first_name, city, area, bio, avatar_url, card_image_url,
  hero_image_url, rating, review_count, years_experience, clients_count,
  reply_time_label, price_from_inr, specialties, tags, badges, testimonial,
  is_verified, is_active, sort_rank
) values
  (
    '00000000-0000-4000-8000-000000000001', 'vikram-rao', 'Vikram Rao', 'Vikram',
    'Bengaluru', 'Indiranagar',
    'Ex-national powerlifter turned coach. I build progressive strength programs around your schedule and track every session, with clean technique, smart nutrition, and no guesswork.',
    'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=72&w=128',
    'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=74&w=640',
    'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=78&w=1200',
    4.9, 128, 8, 120, '~2 hrs', 800,
    array['Strength','Weight loss'], array['Strength training','Hypertrophy','Powerlifting'],
    array['award','verified']::public.trainer_badge[],
    'Structured, patient, and he actually tracks your progress every single week. Down 14 kg and lifting more than ever.',
    true, true, 1
  ),
  (
    '00000000-0000-4000-8000-000000000002', 'meera-iyer', 'Meera Iyer', 'Meera',
    'Bengaluru', 'Koramangala',
    'A weight-loss and mobility coach who keeps plans realistic for busy people. Sessions combine strength basics, movement quality, and simple habit systems.',
    'https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&q=72&w=128',
    'https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&q=74&w=640',
    'https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&q=78&w=1200',
    4.8, 96, 6, 88, '~3 hrs', 700,
    array['Weight loss','Yoga'], array['Weight loss','Mobility','Nutrition'],
    array['verified','loved']::public.trainer_badge[],
    'Lost 9 kg without ever feeling starved. She builds the plan around your life, not the other way around.',
    true, true, 2
  ),
  (
    '00000000-0000-4000-8000-000000000003', 'arjun-nair', 'Arjun Nair', 'Arjun',
    'Bengaluru', 'Whitefield',
    'Boxing and conditioning coach for people who want sharper footwork, better stamina, and sessions that never feel generic.',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=72&w=128',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=74&w=640',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=78&w=1200',
    4.7, 64, 5, 72, '~4 hrs', 900,
    array['Boxing'], array['Boxing','Kickboxing','Conditioning'],
    array['loved']::public.trainer_badge[],
    'Every session wrecks you in the best way. His pad work is next level and the cardio gains are very real.',
    false, true, 3
  ),
  (
    '00000000-0000-4000-8000-000000000004', 'sana-kapoor', 'Sana Kapoor', 'Sana',
    'Bengaluru', 'Jayanagar',
    'Yoga, rehab, and pre/post-natal coach focused on rebuilding strength with patience, breath, and precise progressions.',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=72&w=128',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=74&w=640',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=78&w=1200',
    5.0, 41, 10, 64, '~1 hr', 1000,
    array['Yoga'], array['Pre/post-natal','Yoga','Rehab'],
    array['award','verified']::public.trainer_badge[],
    'Helped me rebuild strength safely after pregnancy. Gentle but effective and incredibly knowledgeable.',
    true, true, 4
  ),
  (
    '00000000-0000-4000-8000-000000000005', 'rohan-desai', 'Rohan Desai', 'Rohan',
    'Bengaluru', 'HSR Layout',
    'Sports performance coach for cricket, athletics, and recreational athletes who want power that transfers outside the gym.',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=72&w=128',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=74&w=640',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=78&w=1200',
    4.6, 52, 4, 58, '~5 hrs', 650,
    array['Sports'], array['Cricket','Athletics','Speed work'],
    array['verified']::public.trainer_badge[],
    'My bowling speed jumped in two months. He knows exactly how to train for the sport, not just the gym.',
    true, true, 5
  ),
  (
    '00000000-0000-4000-8000-000000000006', 'neha-sharma', 'Neha Sharma', 'Neha',
    'Bengaluru', 'JP Nagar',
    'Nutritionist and dietitian building Indian-food meal plans that are sustainable, measurable, and flexible enough for real life.',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=72&w=128',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=74&w=640',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=78&w=1200',
    4.9, 73, 7, 112, '~2 hrs', 600,
    array['Nutrition'], array['Meal plans','Weight loss','Lifestyle'],
    array['award','verified']::public.trainer_badge[],
    'Finally a plan with real Indian food I actually enjoy. No crash diets, just steady results week on week.',
    true, true, 6
  ),
  (
    '00000000-0000-4000-8000-000000000007', 'kabir-menon', 'Kabir Menon', 'Kabir',
    'Bengaluru', 'Bellandur',
    'Functional strength coach who blends conditioning, mobility, and performance habits into high-energy sessions.',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=72&w=128',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=74&w=640',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=78&w=1200',
    4.5, 38, 3, 46, '~6 hrs', 750,
    array['Strength','Sports'], array['Functional','Conditioning','Mobility'],
    array['verified']::public.trainer_badge[],
    'Great energy and never a boring session. Pushed me harder than I thought I could go, safely.',
    true, true, 7
  )
on conflict (slug) do update set
  name = excluded.name,
  first_name = excluded.first_name,
  city = excluded.city,
  area = excluded.area,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  card_image_url = excluded.card_image_url,
  hero_image_url = excluded.hero_image_url,
  rating = excluded.rating,
  review_count = excluded.review_count,
  years_experience = excluded.years_experience,
  clients_count = excluded.clients_count,
  reply_time_label = excluded.reply_time_label,
  price_from_inr = excluded.price_from_inr,
  specialties = excluded.specialties,
  tags = excluded.tags,
  badges = excluded.badges,
  testimonial = excluded.testimonial,
  is_verified = excluded.is_verified,
  is_active = excluded.is_active,
  sort_rank = excluded.sort_rank;

insert into public.trainer_media (id, trainer_id, media_type, url, poster_url, sort_order) values
  ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','video','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=78&w=1200',1),
  ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','photo','https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=78&w=1200',null,2),
  ('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','photo','https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&q=78&w=1200',null,1),
  ('10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003','photo','https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=78&w=1200',null,1),
  ('10000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000004','photo','https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=78&w=1200',null,1),
  ('10000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000005','photo','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=78&w=1200',null,1),
  ('10000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000006','photo','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=78&w=1200',null,1),
  ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000007','photo','https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=78&w=1200',null,1)
on conflict (id) do update set
  trainer_id = excluded.trainer_id,
  media_type = excluded.media_type,
  url = excluded.url,
  poster_url = excluded.poster_url,
  sort_order = excluded.sort_order;

insert into public.trainer_pricing (id, trainer_id, name, description, price_inr, unit, badge, sort_order) values
  ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Trial session','45 min meet and assess',null,'first session','START HERE',1),
  ('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Per session','60 min pay as you go',800,'per session',null,2),
  ('20000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','Monthly plan','12 sessions plus WhatsApp support',6000,'per month','SAVE 22%',3),
  ('20000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002','Trial session','45 min meet and assess',null,'first session','START HERE',1),
  ('20000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000002','Per session','60 min pay as you go',700,'per session',null,2),
  ('20000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000002','Monthly plan','12 sessions plus WhatsApp support',5200,'per month','SAVE 22%',3),
  ('20000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000003','Trial session','45 min meet and assess',null,'first session','START HERE',1),
  ('20000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000003','Per session','60 min pay as you go',900,'per session',null,2),
  ('20000000-0000-4000-8000-000000000009','00000000-0000-4000-8000-000000000003','Monthly plan','12 sessions plus WhatsApp support',6750,'per month','SAVE 22%',3),
  ('20000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000004','Trial session','45 min meet and assess',null,'first session','START HERE',1),
  ('20000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000004','Per session','60 min pay as you go',1000,'per session',null,2),
  ('20000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000004','Monthly plan','12 sessions plus WhatsApp support',7500,'per month','SAVE 22%',3),
  ('20000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000005','Trial session','45 min meet and assess',null,'first session','START HERE',1),
  ('20000000-0000-4000-8000-000000000014','00000000-0000-4000-8000-000000000005','Per session','60 min pay as you go',650,'per session',null,2),
  ('20000000-0000-4000-8000-000000000015','00000000-0000-4000-8000-000000000005','Monthly plan','12 sessions plus WhatsApp support',4900,'per month','SAVE 22%',3),
  ('20000000-0000-4000-8000-000000000016','00000000-0000-4000-8000-000000000006','Trial session','45 min meet and assess',null,'first session','START HERE',1),
  ('20000000-0000-4000-8000-000000000017','00000000-0000-4000-8000-000000000006','Per session','60 min pay as you go',600,'per session',null,2),
  ('20000000-0000-4000-8000-000000000018','00000000-0000-4000-8000-000000000006','Monthly plan','12 sessions plus WhatsApp support',4500,'per month','SAVE 22%',3),
  ('20000000-0000-4000-8000-000000000019','00000000-0000-4000-8000-000000000007','Trial session','45 min meet and assess',null,'first session','START HERE',1),
  ('20000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000007','Per session','60 min pay as you go',750,'per session',null,2),
  ('20000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000007','Monthly plan','12 sessions plus WhatsApp support',5600,'per month','SAVE 22%',3)
on conflict (id) do update set
  trainer_id = excluded.trainer_id,
  name = excluded.name,
  description = excluded.description,
  price_inr = excluded.price_inr,
  unit = excluded.unit,
  badge = excluded.badge,
  sort_order = excluded.sort_order;

insert into public.trainer_reviews (id, trainer_id, client_name, client_initials, avatar_color, rating, review_text, when_label, is_verified, sort_order) values
  ('40000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Aarav R.','AR','#F02D28',5.0,'Vikram completely changed how I train. Structured, patient, and he actually tracks your progress every single week.','2 weeks ago',true,1),
  ('40000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Priya S.','PS','#3B8CFF',4.9,'I was nervous about lifting at first. He fixed my form from day one and never made me feel out of place.','1 month ago',true,2),
  ('40000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','Rhea M.','RM','#A05CFF',4.8,'Meera built a plan around real life and real food. The weight came down without panic dieting.','3 weeks ago',true,1),
  ('40000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003','Dev K.','DK','#F02D28',4.7,'Arjun keeps every session sharp. Footwork, pads, conditioning, all of it improved fast.','1 month ago',true,1),
  ('40000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000004','Nisha P.','NP','#1FCB6B',5.0,'Sana helped me rebuild strength safely. Calm, specific, and very knowledgeable.','2 weeks ago',true,1),
  ('40000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000005','Karan S.','KS','#3B8CFF',4.6,'My bowling speed improved and my shoulder finally stopped feeling fragile.','1 month ago',true,1),
  ('40000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000006','Ananya B.','AB','#A05CFF',4.9,'Neha made meal planning feel normal. No crash diet, just clear portions and steady wins.','3 weeks ago',true,1),
  ('40000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000007','Sahil M.','SM','#F02D28',4.5,'Kabir brings great energy and keeps the sessions challenging without being reckless.','2 weeks ago',true,1)
on conflict (id) do update set
  trainer_id = excluded.trainer_id,
  client_name = excluded.client_name,
  client_initials = excluded.client_initials,
  avatar_color = excluded.avatar_color,
  rating = excluded.rating,
  review_text = excluded.review_text,
  when_label = excluded.when_label,
  is_verified = excluded.is_verified,
  sort_order = excluded.sort_order;

insert into public.trainer_transformations (id, trainer_id, result_label, duration_label, before_image_url, after_image_url, client_name, client_initials, avatar_color, review, is_confirmed, sort_order) values
  ('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','-14 kg','6 months','https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&q=74&w=640','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=74&w=640','Aarav R.','AR','#F02D28','I came in unable to finish a single set. The plan rebuilt nutrition, sleep, and training in a way I could actually follow.',true,1),
  ('30000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','First 100 kg deadlift','4 months','https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=74&w=640','https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=74&w=640','Nikhil M.','NM','#3B8CFF','The cueing was precise and the progression never felt random. I hit a goal I had been circling for years.',true,2),
  ('30000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','-9 kg','5 months','https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&q=74&w=640','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=74&w=640','Rhea M.','RM','#A05CFF','The plan was steady and flexible. I stopped restarting every Monday and finally trusted the process.',true,1),
  ('30000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000006','-8 kg','4 months','https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&q=74&w=640','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=74&w=640','Ananya B.','AB','#A05CFF','Neha made food simple again. I knew what to eat, why it worked, and how to adjust it.',true,1)
on conflict (id) do update set
  trainer_id = excluded.trainer_id,
  result_label = excluded.result_label,
  duration_label = excluded.duration_label,
  before_image_url = excluded.before_image_url,
  after_image_url = excluded.after_image_url,
  client_name = excluded.client_name,
  client_initials = excluded.client_initials,
  avatar_color = excluded.avatar_color,
  review = excluded.review,
  is_confirmed = excluded.is_confirmed,
  sort_order = excluded.sort_order;

insert into public.trainer_locations (id, trainer_id, name, area, sort_order) values
  ('50000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','IronWorks Strength Co.','Indiranagar - 4.2 km',1),
  ('50000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Cult.fit HSR Layout','HSR Layout - 7.8 km',2),
  ('50000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','Peak Mobility Studio','Koramangala - 2.1 km',1),
  ('50000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003','Southpaw Boxing Club','Whitefield - 3.8 km',1),
  ('50000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000004','The Breath Studio','Jayanagar - 1.6 km',1),
  ('50000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000005','Athlete Lab','HSR Layout - 2.4 km',1),
  ('50000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000006','Remote nutrition coaching','Online',1),
  ('50000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000007','Forge Functional Fitness','Bellandur - 3.5 km',1)
on conflict (id) do update set
  trainer_id = excluded.trainer_id,
  name = excluded.name,
  area = excluded.area,
  sort_order = excluded.sort_order;

insert into public.trainer_credentials (id, trainer_id, title, subtitle, credential_type, is_verified, sort_order) values
  ('60000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Certified','NSCA-CSCS document verified','certified',true,1),
  ('60000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','ID Verified','Government ID confirmed','id',true,2),
  ('60000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','First-aid trained','CPR and basic life support','medical',true,3),
  ('60000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002','Certified','ACE personal trainer document verified','certified',true,1),
  ('60000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000003','Certified','Boxing conditioning coach','certified',true,1),
  ('60000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000004','Certified','Yoga Alliance document verified','certified',true,1),
  ('60000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000005','Certified','Sports performance specialist','certified',true,1),
  ('60000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000006','Certified','Registered dietitian document verified','certified',true,1),
  ('60000000-0000-4000-8000-000000000009','00000000-0000-4000-8000-000000000007','Certified','Functional strength coach','certified',true,1)
on conflict (id) do update set
  trainer_id = excluded.trainer_id,
  title = excluded.title,
  subtitle = excluded.subtitle,
  credential_type = excluded.credential_type,
  is_verified = excluded.is_verified,
  sort_order = excluded.sort_order;

insert into public.stories (id, trainer_id, title, author_name, excerpt, image_url, avatar_url, is_featured, is_active, sort_order) values
  ('70000000-0000-4000-8000-000000000001',null,'-14 kg in six months','Aarav R.','Six months ago I could not finish a single set. Vikram rebuilt my plan from scratch and the weight just kept coming off.','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=78&w=1200','https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=72&w=128',true,true,1),
  ('70000000-0000-4000-8000-000000000002',null,'From ACL tear to the podium','Coach Meera','The doctors said I might not compete again. I spent a year relearning how to move before I touched a barbell.','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=78&w=1200','https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&q=72&w=128',true,true,2),
  ('70000000-0000-4000-8000-000000000003',null,'Gold at state powerlifting','IronWorks Pune','We walked in as underdogs and left with three golds. This was the last twelve weeks of prep.','https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=78&w=1200','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=72&w=128',true,true,3),
  ('70000000-0000-4000-8000-000000000004',null,'75 Hard, day 60 of 75','Rhea S.','Day 60 and my legs are shot, but I have not missed a session yet. Some mornings the only win is showing up.','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=78&w=1200','https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=72&w=128',true,true,4),
  ('70000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000001','How Vikram structures a busy week','Vikram','Most clients do not need more motivation. They need a plan that survives real calendars, travel, and tired days.','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=78&w=1200','https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=72&w=128',false,true,1),
  ('70000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000001','Why we film form every month','Vikram','Progress becomes easier to trust when you can see movement getting cleaner, not just numbers going up.','https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=78&w=1200','https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=72&w=128',false,true,2)
on conflict (id) do update set
  trainer_id = excluded.trainer_id,
  title = excluded.title,
  author_name = excluded.author_name,
  excerpt = excluded.excerpt,
  image_url = excluded.image_url,
  avatar_url = excluded.avatar_url,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
