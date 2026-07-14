create table if not exists public.trainer_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  approval_status text not null default 'draft'
    check (approval_status in ('draft', 'review', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trainer_accounts enable row level security;

drop policy if exists "Trainers can read own account" on public.trainer_accounts;
create policy "Trainers can read own account"
on public.trainer_accounts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Trainers can create own account" on public.trainer_accounts;
create policy "Trainers can create own account"
on public.trainer_accounts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Trainers can update own draft account" on public.trainer_accounts;
create policy "Trainers can update own draft account"
on public.trainer_accounts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_trainer_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_trainer_accounts_updated_at on public.trainer_accounts;
create trigger set_trainer_accounts_updated_at
before update on public.trainer_accounts
for each row execute function public.set_trainer_accounts_updated_at();

create or replace function public.create_trainer_account_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ->> 'role' = 'trainer' then
    insert into public.trainer_accounts (user_id, display_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', '')
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists create_trainer_account_for_auth_user on auth.users;
create trigger create_trainer_account_for_auth_user
after insert on auth.users
for each row execute function public.create_trainer_account_for_auth_user();
