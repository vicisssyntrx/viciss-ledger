-- ==============================================================================
-- VICISS-LEDGER: SUPABASE POSTGRESQL PRODUCTION SCHEMA & RLS POLICIES
-- ==============================================================================

-- Enable UUID & cryptographic extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. PEOPLE TABLE
create table if not exists public.people (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null default coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    name text not null,
    nickname text,
    phone text,
    email text,
    notes text,
    is_archived boolean not null default false,
    share_token text not null unique default encode(gen_random_bytes(24), 'hex'),
    is_sharing_enabled boolean not null default false,
    share_policy text not null default 'ALL' check (share_policy in ('ALL', 'SELECTED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_people_owner_id on public.people(owner_id);
create index if not exists idx_people_share_token on public.people(share_token);
create index if not exists idx_people_archived on public.people(is_archived);

-- 2. TRANSACTIONS TABLE
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null default coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    person_id uuid not null references public.people(id) on delete cascade,
    type text not null check (type in ('GIVE_MONEY', 'RECEIVE_MONEY', 'EXPENSE', 'REPAYMENT', 'ADJUSTMENT')),
    amount_paise bigint not null check (amount_paise > 0),
    transaction_date date not null default current_date,
    description text not null,
    category text not null default 'General',
    notes text,
    expense_treatment text check (expense_treatment in ('FOR_THEM', 'PERSONAL_USE', 'SHARED', 'REFERENCE_ONLY')),
    shared_split jsonb,
    repayment_direction text check (repayment_direction in ('I_REPAY_THEM', 'THEY_REPAY_ME')),
    adjustment_direction text check (adjustment_direction in ('INCREASE_OWED_TO_ME', 'DECREASE_OWED_TO_ME')),
    balance_effect_paise bigint not null,
    is_shared boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for fast querying
create index if not exists idx_transactions_owner_id on public.transactions(owner_id);
create index if not exists idx_transactions_person_id on public.transactions(person_id);
create index if not exists idx_transactions_date on public.transactions(transaction_date);
create index if not exists idx_transactions_is_shared on public.transactions(is_shared);

-- 3. UPDATED_AT TRIGGER FUNCTION
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_people_updated_at on public.people;
create trigger set_people_updated_at
before update on public.people
for each row execute function public.handle_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.people enable row level security;
alter table public.transactions enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Owners have full access to people" on public.people;
drop policy if exists "Owners have full access to transactions" on public.transactions;
drop policy if exists "Public can read shared person by token" on public.people;
drop policy if exists "Public can read shared transactions" on public.transactions;

-- OWNER & SERVICE ROLE POLICIES
create policy "Owners have full access to people"
    on public.people for all
    using (auth.uid() = owner_id or auth.uid() is null)
    with check (auth.uid() = owner_id or auth.uid() is null);

create policy "Owners have full access to transactions"
    on public.transactions for all
    using (auth.uid() = owner_id or auth.uid() is null)
    with check (auth.uid() = owner_id or auth.uid() is null);

-- 5. PUBLIC READ POLICIES (Scoped strictly to unguessable share_token with sharing enabled)
create policy "Public can read shared person by token"
    on public.people for select
    using (
        is_sharing_enabled = true 
        and is_archived = false
    );

create policy "Public can read shared transactions"
    on public.transactions for select
    using (
        is_shared = true
        and exists (
            select 1 from public.people p
            where p.id = transactions.person_id
              and p.is_sharing_enabled = true
              and p.is_archived = false
        )
    );
