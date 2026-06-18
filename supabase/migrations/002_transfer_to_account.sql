-- Transfer destination account (nullable; only set for type = transfer)
alter table public.transactions
  add column if not exists to_account_name text;
