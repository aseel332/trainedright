# TrainedRight

A marketplace for finding fitness trainers, gym coaches, sports coaches, yoga instructors and dietitians across India. Clients compare verified reviews, real transformations and prices, then contact a trainer directly on WhatsApp, with no commission or booking fee.

## Why

Finding a good trainer in India mostly runs on word of mouth and Instagram, where reviews and before/after photos are easy to fake. TrainedRight gives every trainer a public profile where reviews and transformations are submitted by the client through a one-time link, so the social proof is real.

## Features

- **Search and discovery:** filter by coach type, sport, city, price and experience. Programmatic SEO pages for every profession and city (`/[profession]`, `/[profession]/[city]`).
- **Trainer profiles:** bio, pricing, media gallery, social links, stories and client transformations.
- **Client-verified social proof:** trainers send a tokenized link; the client submits the review or before/after themselves (`/review/[token]`, `/transform/[token]`).
- **Trainer onboarding:** sign-up, phone verification, guided onboarding and a dashboard to edit and publish a profile.
- **Admin panel:** review and publish trainers, and edit homepage content.
- **SEO built in:** sitemap, robots.txt, canonical URLs, Open Graph tags and JSON-LD structured data.
- **Analytics:** lightweight profile-event tracking with rate limiting and de-duplication.

## Tech stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, lucide-react |
| Backend | Supabase: Postgres, Auth, Storage, Row Level Security |
| Data | SQL migrations in `supabase/migrations` |

## Architecture

- Public pages read through the Supabase anon key, protected by Row Level Security.
- Privileged writes (publishing, token submissions, admin actions) run server-side with the service-role client in `lib/server/`.
- The auth session is refreshed in `proxy.ts`.

## Getting started

```bash
git clone https://github.com/aseel332/trainedright.git
cd trainedright
npm install
cp .env.example .env.local   # add your Supabase keys and site URL
npm run dev
```

Apply the SQL files in `supabase/migrations` to your Supabase project in order, then open http://localhost:3000.

## Project structure

```
app/          routes: home, search pages, trainer profiles, dashboard, admin
components/   UI components (home sections, profile, dashboards, editors)
lib/          shared utilities; lib/server holds server-only data access
supabase/     database migrations
```
