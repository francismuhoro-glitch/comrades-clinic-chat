-- Comrades Clinic — Referral program: student codes, invite flow, campus ambassadors
--
-- Adds referral_code + ambassador tracking to profiles, referral tracking to
-- consultations, and a dedicated referrals table for analytics and rewards.
--
-- Discount hook: first consult KSh 50 off (pay 100) when a valid referral code
-- is used. Referrer earns KSh 30 credit after referee's first completed consult.
-- Credits can be applied to future consults (tracked in profiles.referral_credits_kes).
--
-- Apply manually via Supabase SQL editor. Idempotent.

-- 1. Profiles: referral code, ambassador flag, credits -----------------------

alter table public.profiles
  add column if not exists referral_code text;

alter table public.profiles
  add column if not exists is_ambassador boolean default false;

alter table public.profiles
  add column if not exists referral_credits_kes integer default 0;

-- Unique index for referral_code (case-insensitive via lower())
create unique index if not exists profiles_referral_code_unique_idx
  on public.profiles (lower(referral_code))
  where referral_code is not null;

create index if not exists profiles_is_ambassador_idx
  on public.profiles (is_ambassador) where is_ambassador = true;

-- 2. Consultations: referral tracking ---------------------------------------

alter table public.consultations
  add column if not exists referral_code_used text;

alter table public.consultations
  add column if not exists referral_discount_kes integer default 0;

alter table public.consultations
  add column if not exists referred_by_profile_id uuid references public.profiles(id) on delete set null;

create index if not exists consultations_referral_code_used_idx
  on public.consultations (lower(referral_code_used)) where referral_code_used is not null;

create index if not exists consultations_referred_by_idx
  on public.consultations (referred_by_profile_id) where referred_by_profile_id is not null;

-- 3. Referrals table: one row per successful referral invite ----------------

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  referrer_profile_id uuid not null references public.profiles(id) on delete cascade,
  referred_profile_id uuid references public.profiles(id) on delete set null,
  referred_consultation_id uuid references public.consultations(id) on delete set null,
  discount_kes integer not null default 50,
  reward_kes integer not null default 30,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rewarded')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists referrals_referrer_idx
  on public.referrals (referrer_profile_id, created_at desc);

create index if not exists referrals_code_idx
  on public.referrals (lower(code));

create index if not exists referrals_status_idx
  on public.referrals (status);

-- 4. RLS (transitional: anon + authenticated can read/write, matching existing posture)

alter table public.referrals enable row level security;

drop policy if exists "referrals app access" on public.referrals;
create policy "referrals app access"
  on public.referrals for all
  to anon, authenticated
  using (true)
  with check (true);

-- 5. Realtime (so referrer sees new referrals live)

do $$
begin
  begin
    alter publication supabase_realtime add table public.referrals;
  exception when duplicate_object then null;
  end;
end $$;

-- 6. Helper function: generate a random referral code (e.g. COMR7X2)
-- Not used directly by the app (code gen is client-side + server-fn), but handy for backfill.

create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'COM';
  i int;
begin
  for i in 1..5 loop
    result := result || substr(chars, floor(random()*length(chars)+1)::int, 1);
  end loop;
  return result;
end;
$$;
