-- Comrades Clinic — Supabase schema
-- Idempotent: safe to run on a fresh project OR an existing one that already
-- has earlier versions of these tables (missing columns are added).
--
-- Apply via the Supabase SQL editor, or `supabase db push` if you use the CLI.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.consultations (
  id uuid primary key,
  patient_name text,
  patient_phone text,
  campus text,
  symptoms_description text,
  symptoms_selected text[],
  triage_level text default 'routine',
  status text default 'payment_pending',
  paid boolean default false,
  payment_status text,
  mpesa_code text,
  payment_phone text,
  lab_test_requested boolean default false,
  diagnosis text,
  prescription jsonb,
  referral jsonb,
  lab_order jsonb,
  patient_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key,
  consultation_id uuid references public.consultations (id) on delete cascade,
  sender_role text not null check (sender_role in ('patient', 'doctor', 'system')),
  sender_name text,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clinic_settings (
  id text primary key,
  pochi_phone text,
  pochi_name text,
  helpline_phone text,
  consultation_fee_kes integer default 150,
  updated_at timestamptz default now()
);

-- Columns added over time (no-ops when they already exist).
alter table public.consultations add column if not exists paid boolean default false;
alter table public.consultations add column if not exists payment_status text;
alter table public.consultations add column if not exists mpesa_code text;
alter table public.consultations add column if not exists payment_phone text;
alter table public.consultations add column if not exists lab_test_requested boolean default false;
alter table public.consultations add column if not exists diagnosis text;
alter table public.consultations add column if not exists prescription jsonb;
alter table public.consultations add column if not exists referral jsonb;
alter table public.consultations add column if not exists lab_order jsonb;
alter table public.consultations add column if not exists patient_id uuid references auth.users (id);
alter table public.consultations add column if not exists ended_at timestamptz;
alter table public.messages add column if not exists sender_name text;

create index if not exists consultations_patient_id_idx on public.consultations (patient_id);
create index if not exists consultations_patient_phone_idx on public.consultations (patient_phone);
create index if not exists messages_consultation_id_idx on public.messages (consultation_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- NOTE: the doctor portal currently uses the anon key (it authenticates with a
-- server-side session cookie, not Supabase Auth), and intake happens before a
-- patient signs in. The policies below therefore still allow anon access so the
-- app keeps working end-to-end, while giving signed-in patients first-class
-- access to their own rows.
--
-- TODO(security): once the doctor moves onto Supabase Auth with a `doctor`
-- role, replace the permissive anon policies with role-scoped ones.

alter table public.consultations enable row level security;
alter table public.messages enable row level security;
alter table public.clinic_settings enable row level security;

-- Signed-in patients: full read of their own visits.
drop policy if exists "patients read own consultations" on public.consultations;
create policy "patients read own consultations"
  on public.consultations for select
  to authenticated
  using (patient_id = auth.uid());

-- Signed-in patients: claim unowned visits (link-by-phone) and update their own.
drop policy if exists "patients claim or update own consultations" on public.consultations;
create policy "patients claim or update own consultations"
  on public.consultations for update
  to authenticated
  using (patient_id is null or patient_id = auth.uid())
  with check (patient_id = auth.uid());

-- Transitional permissive policies (anon + authenticated) so the current
-- doctor portal and pre-login intake keep working. Tighten these when the
-- doctor is on Supabase Auth.
drop policy if exists "clinic app access" on public.consultations;
create policy "clinic app access"
  on public.consultations for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "clinic app messages access" on public.messages;
create policy "clinic app messages access"
  on public.messages for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "clinic settings access" on public.clinic_settings;
create policy "clinic settings access"
  on public.clinic_settings for all
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
-- Required so the patient instantly sees doctor actions (lab requests, payment
-- confirmations, chat) and vice versa.

do $$
begin
  begin
    alter publication supabase_realtime add table public.consultations;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
end $$;
