-- Custom JWT auth — replaces Supabase Auth (auth.users)
-- Run after 001_initial.sql and 002_transfer_to_account.sql

-- Identity table (replaces auth.users + profiles for app auth)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null unique,
  password_hash text,
  google_sub text unique,
  display_name text,
  avatar_url text,
  preferred_currency text not null default 'INR',
  tier text not null default 'standard',
  email_verified boolean not null default false,
  failed_login_attempts int not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_auth_method check (password_hash is not null or google_sub is not null)
);

create index if not exists idx_users_email_normalized on public.users (email_normalized);
create index if not exists idx_users_google_sub on public.users (google_sub) where google_sub is not null;

-- Refresh tokens (hashed at rest — PCI/OWASP: never store plaintext)
create table if not exists public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_refresh_tokens_user on public.refresh_tokens (user_id);
create index if not exists idx_refresh_tokens_hash on public.refresh_tokens (token_hash);

-- Migrate existing Supabase Auth users + profiles into public.users (idempotent)
insert into public.users (
  id, email, email_normalized, display_name, preferred_currency, email_verified, created_at, updated_at
)
select
  p.id,
  coalesce(au.email, p.id::text || '@migrated.local'),
  lower(coalesce(au.email, p.id::text || '@migrated.local')),
  p.display_name,
  p.preferred_currency,
  au.email_confirmed_at is not null,
  p.created_at,
  p.updated_at
from public.profiles p
left join auth.users au on au.id = p.id
on conflict (email_normalized) do nothing;

-- Repoint foreign keys from auth.users → public.users
alter table public.accounts drop constraint if exists accounts_user_id_fkey;
alter table public.transactions drop constraint if exists transactions_user_id_fkey;
alter table public.budgets drop constraint if exists budgets_user_id_fkey;
alter table public.investments drop constraint if exists investments_user_id_fkey;
alter table public.scheduled_payments drop constraint if exists scheduled_payments_user_id_fkey;
alter table public.broker_connections drop constraint if exists broker_connections_user_id_fkey;
alter table public.ai_insight_runs drop constraint if exists ai_insight_runs_user_id_fkey;

alter table public.accounts
  add constraint accounts_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;
alter table public.transactions
  add constraint transactions_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;
alter table public.budgets
  add constraint budgets_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;
alter table public.investments
  add constraint investments_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;
alter table public.scheduled_payments
  add constraint scheduled_payments_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;
alter table public.broker_connections
  add constraint broker_connections_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;
alter table public.ai_insight_runs
  add constraint ai_insight_runs_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;

-- Drop Supabase Auth trigger (no longer used)
drop trigger if exists on_auth_user_created on auth.users;
