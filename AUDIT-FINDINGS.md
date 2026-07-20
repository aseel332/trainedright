# TrainedRight — Codebase Audit Findings

**Date:** 2026-07-19
**Scope:** Full codebase review focused on security, completeness, database storage integrity, orphaned/inaccessible data, and unfinished or disconnected features.
**Stack:** Next.js 16 (App Router), React 19, Supabase (Postgres + Auth + Storage). Auth session refreshed in `proxy.ts` → `lib/server/auth-session.ts`. Public reads via anon key + RLS; privileged writes via service-role client.

---

## How to read this

Findings are grouped by theme and each carries a severity:

- **Critical** — exploitable now, exposes private data or allows tampering.
- **High** — serious weakness; exploitable under a realistic condition (e.g. a config flag, an unapplied migration).
- **Medium** — integrity / correctness problem, or a leak of low-sensitivity data.
- **Low / Info** — hardening, or intentional-but-worth-noting.

The single most important thing to verify first is **whether migration `20260717000000` has actually been applied to the live database** (see S1). Several protections depend on it.

---

## Fix status (updated 2026-07-19)

Fixes that were safe to make in code without changing the user-facing flow have been applied and the project **builds, typechecks, and lints clean**. Verified with `npx next build` (exit 0).

| ID | Finding | Status |
|----|---------|--------|
| S1 | Anon RLS enumeration/tamper on request tables | **Mitigated in code** — new migration `20260719000000_revoke_anon_request_access.sql` idempotently drops the anon policies and revokes anon grants. *Still requires applying migrations to the live DB.* |
| S4 | `/api/track` unauthenticated / unthrottled | **Fixed** — per-IP rate limit + per-(ip,slug,event) dedup added in `app/api/track/route.ts`. |
| S5 | No admin login throttle | **Fixed** — in-memory brute-force lockout in `lib/server/admin-auth.ts`, enforced in `adminSignIn`. |
| D1 | `blob:` preview URLs persisted to DB | **Fixed** — server-side backstop (`stripUnstorableImages` / `isStorableUrl`) in the save + token-submit paths, plus all client upload sites now refuse non-persisted URLs and surface an error. |
| D2 | `submissions/` uploads never cleaned up | **Fixed** — `deleteSubmissionUploads` added and wired into transformation-request deletion and admin trainer deletion. |
| S2 | Credential docs in public bucket | **Not changed** — proper fix (private bucket + signed URLs) changes how images are served. See recommendation below. |
| S3 | OTP dev mode enabled | **Not changed** — flipping it off breaks phone verification until real SMS is wired. Config decision. |
| O1–O3, U1 | Missing/disconnected features | **Not changed** — building them changes the product flow. |

---

## 1. Security

### S1 — Anonymous RLS policies expose and allow tampering with all pending client submissions *(Critical, if migration not applied)*

`supabase/migrations/20260714002000_trainer_profiles_and_links.sql` creates these policies on `review_requests` and `transformation_requests`:

```sql
create policy "Anyone with link can read pending review" ... for select to anon using (status = 'pending');
create policy "Anyone with link can submit pending review" ... for update to anon using (status = 'pending' and source = 'client_link') with check (status = 'submitted');
-- same pattern for transformation_requests (no source restriction on the update)
```

The `select ... using (status = 'pending')` policy has **no token predicate**. Any client holding the public anon key can run `select * from review_requests where status = 'pending'` and enumerate **every** pending review/transformation across **all** trainers — client names and trainer display names included. The `update` policy lets an anonymous caller mark any pending row `submitted` with attacker-chosen rating/text.

Migration `20260717000000_production_cleanup_and_events.sql` **drops** all four policies and moves the flow server-side (service-role reads/writes with explicit token + status checks in `lib/server/token-requests.ts`), which is the correct design. **But per the project's own notes, `20260717` is pending manual application in the Supabase SQL editor.** Until it runs on the live database, the leak and tampering vector above are active.

- **Verify:** In Supabase, confirm these four policies no longer exist and `trainer_events` exists.
- **Fix:** Apply `20260717000000`. Also `revoke update on review_requests, transformation_requests from anon;` — the grant from the earlier migration is broader than the server-mediated flow needs (RLS blocks it once policies are gone, but the grant is dead surface area).

### S2 — Public storage bucket exposes credential documents (government ID, medical certificates) *(High)*

`trainer-uploads` is created as a **public** bucket, and the storage RLS policy is:

```sql
create policy "Public read trainer uploads" on storage.objects
for select to anon, authenticated using (bucket_id = 'trainer-uploads');
```

Trainers upload **credential documents** — government ID, medical/first-aid certs, certification PDFs — into `trainer-uploads/<userId>/...` (see `uploadDocument` in `trainer-onboarding-client.tsx:1771`, folder = `userId`). Because the bucket is public and the anon policy matches the whole bucket:

- Anyone with a file URL can fetch these ID/medical documents (no expiry, no auth).
- The anon key can **list** objects (`storage.from('trainer-uploads').list('<userId>')`), so files are enumerable per-folder, not just guessable.

Filenames use `crypto.randomUUID()`, which raises the bar for guessing a single URL, but listing defeats that. Sensitive KYC-style documents should not live in a world-readable bucket.

- **Fix:** Move credential documents to a **private** bucket and serve them to the trainer/admin via signed URLs (`createSignedUrl`) only. Keep avatars/gallery/cover (genuinely public marketing images) in the public bucket. At minimum, remove the anon `list` capability and scope reads.

### S3 — On-screen OTP "dev mode" is enabled; phone verification is bypassable *(High)*

`.env.local` has `NEXT_PUBLIC_OTP_DEV_MODE=true`. In this mode (`app/trainer/verify-phone/actions.ts`), the server **generates the OTP, returns it to the browser to display, and marks the phone confirmed via the admin API without ever sending an SMS**. Phone confirmation is the first gate into the dashboard (`app/trainer/dashboard/page.tsx` redirects on `!user.phone_confirmed_at`), so with this flag on, that gate proves nothing — a user simply reads the code back to the server for any number they type.

This is fine as a stopgap while Twilio is down, but:

- The flag is `NEXT_PUBLIC_*`, so it is baked into the client bundle and trivially observable.
- If it ships to production, phone verification is security theatre.

- **Fix:** Ensure the flag is `false` in production. Wire up the real SMS provider (the fallback path using Supabase `updateUser`/`verifyOtp` already exists in `trainer-phone-verify-client.tsx`). Consider making the toggle a server-only env var so it can't be flipped/observed from the client.

### S4 — `/api/track` is unauthenticated and unthrottled → analytics poisoning *(Medium)*

`app/api/track/route.ts` accepts anonymous `POST`s and writes `trainer_events` rows via the service-role client for any valid slug. There is no auth, no rate limit, and no dedup. Anyone can inflate (or, with volume, distort) any trainer's `profile_view` / `whatsapp_click` / `trial_request` / `save` / `share` counts — the exact "real demand analytics" the dashboard sells (`lib/server/analytics.ts`).

This is inherent to a fire-and-forget beacon, but the numbers are presented to trainers as trustworthy demand signals.

- **Fix:** Add basic abuse controls — per-IP rate limiting (Vercel WAF/BotID or an in-function limiter), a short-window dedup per (slug, event, ip), and optionally drop obviously scripted traffic. Treat the figures as approximate in the UI.

### S5 — Admin auth hardening *(Low)*

`lib/server/admin-auth.ts` is a single static credential pair from `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Two notes:

- When `ADMIN_SESSION_SECRET` is unset, the session-signing secret is derived from `sha256("trainedright-admin:<email>:<password>")`. Anyone who learns the admin email+password (e.g. from a leaked `.env`) can forge sessions offline. Set an independent `ADMIN_SESSION_SECRET`.
- There is no rate limiting on `adminSignIn`. Credential compare is constant-time (good), but brute-forcing is otherwise unthrottled.

The session token is `expiresAt.hmac(expiresAt)` with no per-session nonce or revocation list — acceptable for a single-admin console, but it means a captured cookie is replayable until expiry (12h).

### S6 — `.env.local` contains live secrets and is git-ignored *(Info — verify)*

`.gitignore` correctly ignores `.env*` (only `.env.example` is tracked), and `git ls-files` confirms `.env.local` is **not** committed. Good. Just ensure the service-role key / admin password in `.env.local` have never been committed historically and are rotated if this repo was ever shared.

---

## 2. Database storage & data integrity

### D1 — Failed uploads persist unusable `blob:` URLs into the profile *(Medium)*

`lib/client/upload.ts` returns `{ url, persisted }`, where `persisted: false` means storage was unavailable and `url` is a **local `blob:` object URL** valid only in that one browser tab. **Every caller ignores `persisted`** and stores `result.url` straight into the profile draft:

- `trainer-onboarding-client.tsx:731,1304,1317,1772`
- `trainer-dashboard-client.tsx:1704,1706`
- `transformation-submit-client.tsx:69,71`

When the trainer saves, `saveTrainerProfile` writes those `blob:` strings into `trainer_accounts.profile` (jsonb) and they get published into the public `trainers` / `trainer_media` tables. The result is permanently broken images on the public profile. `storagePathFromPublicUrl` returns `null` for `blob:` URLs, so cleanup never touches them either — they just sit in the DB as dead links.

- **Fix:** Check `result.persisted`. If false, surface an "upload failed, try again" error and do **not** store the URL, rather than silently persisting a `blob:` reference.

### D2 — Client-submitted upload folder (`submissions/`) is never cleaned up *(Medium)*

Anonymous transformation submissions (`mode: 'client_all'`) upload before/after photos to `trainer-uploads/submissions/...` (`transformation-submit-client.tsx:67`, folder `"submissions"`). Nothing ever deletes from this folder:

- `sweepTrainerUploads` and `deleteOrphanedUploads` only scan `userId/`.
- `deleteTrainerFolder` (on trainer deletion) only removes `userId/`.

So every client submission photo — including from links that were created but never published, or after a trainer is deleted — accumulates permanently in a public bucket. This is both a storage cost leak and, combined with S2, a pile of world-readable orphaned images no one can manage through the UI.

- **Fix:** Track submission uploads against their `transformation_requests` row and delete them when the request is deleted / the trainer is deleted / the link goes unused past a TTL. Or move submissions to a private bucket keyed by the request id.

### D3 — Schema-drift fallbacks indicate migrations are applied out-of-band *(Info)*

`lib/server/trainer-publish.ts` contains defensive retries that strip columns the live schema "doesn't have yet" (`upsertTrainerRow` drops missing columns one per retry; `insertTransformations` retries without `rating`). This is pragmatic, but it means a partially-migrated database will **silently publish incomplete data** (e.g. no `state`, no socials, no transformation rating) instead of failing loudly. Track migration state explicitly and apply migrations in order; the fallbacks hide drift rather than surfacing it.

---

## 3. Orphaned / inaccessible data (data that can no longer be reached)

### O1 — `headline` is collected in the model but never surfaced or published *(Info/Incomplete)*

`headline` exists on `TrainerProfileDraft` and `emptyProfile` (`lib/trainer-profile.ts`) and is read into the admin view (`admin-dashboard-client.tsx:255`), but:

- There is **no input** for it anywhere in onboarding or the dashboard (grep finds no editor).
- `publishTrainerAccount` never writes it to the public `trainers` table, and no public page renders it.

Any `headline` value that exists in old drafts is effectively dead data — stored, never shown to clients. Either wire it through (input → publish → detail page) or remove it from the model.

### O2 — `area` and `trainer_locations` are never populated for real trainers → dead "Locations" section *(Incomplete)*

- `profile.area` has no input in onboarding/dashboard, so it's always `""`. `publishTrainerAccount` still writes `area: profile.area` (empty) to `trainers.area`.
- `publishTrainerAccount` **never inserts `trainer_locations` rows**. The public detail page renders a "Locations" block from `trainer.locations` (`app/trainers/[slug]/page.tsx:155`), but for every self-serve trainer that array is always empty (the only rows that ever existed were the now-deleted demo seed). The section is dead for all real trainers.

- **Fix:** Either add a locations editor + publish step, or remove the Locations UI until it's built. Decide whether `area` is still meaningful; if not, stop writing it.

### O3 — `stories` can never be created → homepage & profile "stories" sections are permanently empty *(Incomplete)*

The `stories` table is read on the homepage (`getFeaturedStories`, `app/page.tsx:42`) and on trainer detail pages (`fetchProfileChildren`). **No code path inserts into `stories`** anywhere (grep confirms). The only rows ever present were demo seed rows, deleted by `20260717`. So the homepage "stories" carousel and the per-trainer stories section now render empty forever. This is a whole content feature (read UI built, write path missing).

- **Fix:** Build a story authoring path (trainer or admin), or hide the sections until content can exist.

---

## 4. Unfinished / not-yet-connected features

### U1 — Subscription/monetization is stubbed *(Info — intentional)*

`lib/subscription-plans.ts` intentionally ships a single `free-trial` plan; onboarding shows a "contact for details" card instead of paid tiers (`trainer-onboarding-client.tsx:1019`). `profile.subscriptionPlan` is collected and gated on for go-live but has no billing behind it. Fine as a launch state — flagged so it isn't mistaken for complete monetization.

### U2 — Real SMS OTP path not wired *(see S3)*

The production SMS flow exists in code but is bypassed by the dev-mode flag; Twilio (or another provider) isn't configured. Verification is a stopgap until that's done.

---

## Priority order (suggested)

1. **S1** — Confirm/apply migration `20260717`; verify the anon policies are gone. *(Critical)*
2. **S2** — Move credential documents off the public bucket to signed-URL access. *(High)*
3. **S3** — Turn off `NEXT_PUBLIC_OTP_DEV_MODE` for production and wire real SMS. *(High)*
4. **D1** — Stop persisting `blob:` URLs on failed uploads. *(Medium — user-visible broken images)*
5. **S4 / D2** — Rate-limit `/api/track`; clean up `submissions/` storage. *(Medium)*
6. **O2 / O3 / O1** — Decide build-or-hide for Locations, Stories, and `headline`. *(Completeness)*
7. **S5, D3, U1** — Hardening and housekeeping. *(Low/Info)*

---

## What looked correct (worth keeping)

- Auth session refresh in `proxy.ts` correctly carries rotated cookies onto redirects (`auth-session.ts`), avoiding the "refresh logs me out" bug; `next` redirect targets are validated against open-redirects (`safeNext`).
- Token submission is server-mediated with UUID validation and status/source checks (`token-requests.ts`); the row id doubles as an unguessable share token.
- Sign-out is `POST`-only (CSRF-aware); admin page is `noindex`; admin credential compare is constant-time.
- Storage cleanup on the trainer's own folder is careful (whole-set diff, `userId/` prefix restriction, recent-upload grace window) so it can't delete another trainer's files.
- Public reads go through the anon client with RLS restricting to `is_active` rows; the service-role client is `server-only` and never imported client-side.
