-- ExpenseIQ — Supabase Postgres schema + RLS
-- Run in Supabase SQL editor or via supabase db push

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_currency text not null default 'INR',
  tier text not null default 'standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Accounts
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('savings', 'credit', 'investment', 'wallet')),
  bank_name text not null default '',
  balance_paise bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
create policy "accounts_select_own" on public.accounts for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts for update using (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts for delete using (auth.uid() = user_id);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  amount_paise bigint not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  date timestamptz not null default now(),
  category_icon text not null default 'file-text',
  category_color text not null default '#6C63FF',
  category_name text not null default 'General',
  account_name text not null default '',
  note text,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);

-- Budgets
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_name text not null,
  category_icon text not null default 'file-text',
  category_color text not null default '#6C63FF',
  budget_limit_paise bigint not null,
  spent_amount_paise bigint not null default 0,
  target_date timestamptz,
  unique (user_id, category_name)
);

alter table public.budgets enable row level security;
create policy "budgets_all_own" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Investments (synced holdings cache)
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('zerodha', 'groww', 'indmoney', 'other')),
  holding_name text not null,
  current_value_paise bigint not null default 0,
  invested_value_paise bigint not null default 0,
  external_id text,
  synced_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

alter table public.investments enable row level security;
create policy "investments_all_own" on public.investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Scheduled payments
create table if not exists public.scheduled_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount_paise bigint not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  next_due_date timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.scheduled_payments enable row level security;
create policy "scheduled_payments_all_own" on public.scheduled_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Broker connections — SERVER ONLY via service role (no client RLS policies)
create table if not exists public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('zerodha', 'groww')),
  access_token_enc text not null,
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.broker_connections enable row level security;
-- No policies: only service_role (FastAPI) can read/write encrypted tokens

-- AI insight audit log (optional)
create table if not exists public.ai_insight_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_tokens int,
  created_at timestamptz not null default now()
);

alter table public.ai_insight_runs enable row level security;
create policy "ai_runs_select_own" on public.ai_insight_runs for select using (auth.uid() = user_id);

create index if not exists idx_transactions_user_date on public.transactions (user_id, date desc);
create index if not exists idx_investments_user_provider on public.investments (user_id, provider);
