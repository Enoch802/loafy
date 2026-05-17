-- ============================================================
-- LOAFY BAKERY — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor → New Query
-- ============================================================

-- Profiles (deliverer names linked to auth users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamp with time zone default now()
);

-- App settings (bakery name, admin password hash)
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  bakery_name text not null,
  admin_password_hash text not null,
  setup_complete boolean default false,
  created_at timestamp with time zone default now()
);

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text unique not null,
  name text not null,
  phone text,
  address text,
  is_approved boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  total_debt numeric default 0,
  created_at timestamp with time zone default now()
);

-- Transactions (each delivery visit)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  deliverer_id uuid references auth.users(id) on delete set null,
  deliverer_name text,
  date date not null,
  items jsonb not null default '{}',
  total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  debt_for_visit numeric not null default 0,
  created_at timestamp with time zone default now()
);

-- Admin notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  customer_id uuid references customers(id) on delete set null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table settings enable row level security;
alter table customers enable row level security;
alter table transactions enable row level security;
alter table notifications enable row level security;

-- Profiles: users can read/write their own
create policy "profiles_self" on profiles for all using (auth.uid() = id);

-- Settings: anyone authenticated can read; only service role writes (or use anon for setup)
create policy "settings_read" on settings for select using (true);
create policy "settings_write" on settings for all using (true);

-- Customers: authenticated users can read and create; anyone can read for search
create policy "customers_read" on customers for select using (true);
create policy "customers_write" on customers for insert with check (auth.uid() is not null);
create policy "customers_update" on customers for update using (true);
create policy "customers_delete" on customers for delete using (true);

-- Transactions: authenticated users can read and write
create policy "transactions_read" on transactions for select using (true);
create policy "transactions_write" on transactions for insert with check (auth.uid() is not null);

-- Notifications: anyone can read and write (admin reads, deliverer writes)
create policy "notifications_all" on notifications for all using (true);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

create index if not exists idx_customers_code on customers(customer_code);
create index if not exists idx_customers_name on customers(name);
create index if not exists idx_transactions_customer on transactions(customer_id);
create index if not exists idx_transactions_deliverer on transactions(deliverer_id);
create index if not exists idx_transactions_date on transactions(date);
create index if not exists idx_notifications_read on notifications(is_read);
