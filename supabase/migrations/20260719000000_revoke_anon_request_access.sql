-- Hardening: make the anonymous role unable to touch review/transformation
-- requests directly.
--
-- Token links are read and submitted server-side through the service-role
-- client (lib/server/token-requests.ts) with explicit token + status checks.
-- No browser code queries these tables with the anon key. The original
-- 20260714002000 migration granted anon SELECT/UPDATE and added policies that
-- exposed every pending row to enumeration; 20260717000000 dropped those
-- policies. This migration is idempotent and self-contained so the anon
-- surface is closed even if 20260717000000 has not been applied yet, and it
-- additionally revokes the leftover table grants (dead surface area).

-- Drop the enumeration/tamper policies if they still exist.
drop policy if exists "Anyone with link can read pending review"
  on public.review_requests;
drop policy if exists "Anyone with link can submit pending review"
  on public.review_requests;
drop policy if exists "Anyone with link can read pending transformation"
  on public.transformation_requests;
drop policy if exists "Anyone with link can submit pending transformation"
  on public.transformation_requests;

-- Remove the table grants the anon role no longer needs. With RLS enabled and
-- no anon policy, access is already blocked; revoking the grant removes the
-- dead surface entirely.
revoke select, insert, update, delete
  on public.review_requests from anon;
revoke select, insert, update, delete
  on public.transformation_requests from anon;

-- Authenticated trainers still manage their own rows via the existing
-- "Trainers manage own ..." policies, so their grants are left intact.
