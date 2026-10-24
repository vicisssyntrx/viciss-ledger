-- ==============================================================================
-- VICISS-LEDGER: MIGRATION FOR CARD COLORS, ADJUSTMENT TYPES & PERSONAL ACCOUNT
-- Execute this script in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. ADD COLOR & LEDGER_TYPE COLUMNS TO PEOPLE TABLE
alter table public.people 
add column if not exists color text not null default 'default';

alter table public.people 
add column if not exists ledger_type text not null default 'LENDING' check (ledger_type in ('LENDING', 'BORROWING', 'CUSTODIAL'));

-- 2. UPDATE ADJUSTMENT_DIRECTION CHECK CONSTRAINT
-- Adds 'CREDITED_TO_ACCOUNT' and 'DEBITED_FROM_ACCOUNT' to public.transactions
alter table public.transactions 
drop constraint if exists transactions_adjustment_direction_check;

alter table public.transactions 
add constraint transactions_adjustment_direction_check 
check (adjustment_direction in (
    'INCREASE_OWED_TO_ME',
    'DECREASE_OWED_TO_ME',
    'CREDITED_TO_ACCOUNT',
    'DEBITED_FROM_ACCOUNT'
));

-- 3. (OPTIONAL) PERSONAL ACCOUNT SETTINGS & AUDIT TABLE
-- Keeps your personal account baseline and manual adjustments synchronized in PostgreSQL
create table if not exists public.personal_account_settings (
    id text primary key default 'primary',
    owner_id uuid not null default coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    initial_balance_paise bigint not null default 1754552, -- ₹17,545.52
    manual_adjustments_paise bigint not null default 0,
    history jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default now()
);

-- Enable RLS on personal_account_settings
alter table public.personal_account_settings enable row level security;

drop policy if exists "Owners have full access to personal_account_settings" on public.personal_account_settings;
create policy "Owners have full access to personal_account_settings"
    on public.personal_account_settings for all
    using (auth.uid() = owner_id or auth.uid() is null)
    with check (auth.uid() = owner_id or auth.uid() is null);

-- Pre-seed default row if table is empty
insert into public.personal_account_settings (id, initial_balance_paise, manual_adjustments_paise, history)
values (
    'primary',
    1754552,
    0,
    '[{"id":"init-seed","type":"SET","amountPaise":1754552,"description":"Initial starting balance in personal account","createdAt":"2026-10-24T06:00:00Z"}]'::jsonb
)
on conflict (id) do nothing;
