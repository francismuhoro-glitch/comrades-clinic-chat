-- Comrades Clinic — analytics: activation timestamp + updated_at
--
-- Adds columns needed for the /admin analytics dashboard:
--   * activated_at — when the doctor starts the consultation (waiting → active)
--   * updated_at   — last write timestamp (useful for response-time analytics)
--
-- Apply manually via the Supabase SQL editor (not part of the app deploy).
-- Idempotent: safe to run more than once.

-- 1. Columns ---------------------------------------------------------------

alter table public.consultations
  add column if not exists activated_at timestamptz;

alter table public.consultations
  add column if not exists updated_at timestamptz default now();

-- Backfill updated_at for rows that predate the column.
update public.consultations
set updated_at = coalesce(ended_at, created_at, now())
where updated_at is null;

-- 2. Indexes for analytics queries -----------------------------------------

create index if not exists consultations_created_at_idx
  on public.consultations (created_at desc);

create index if not exists consultations_activated_at_idx
  on public.consultations (activated_at desc);

create index if not exists consultations_triage_level_idx
  on public.consultations (triage_level);

create index if not exists consultations_payment_status_idx
  on public.consultations (payment_status);

create index if not exists consultations_status_idx
  on public.consultations (status);

-- 3. Optional trigger to keep updated_at fresh -----------------------------
-- Keeps analytics honest without requiring every app write path to set it.

create or replace function public.set_consultations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  -- Auto-stamp activated_at the first time status becomes active.
  if new.status = 'active' and (old.status is distinct from 'active') and new.activated_at is null then
    new.activated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists consultations_updated_at on public.consultations;

create trigger consultations_updated_at
  before update on public.consultations
  for each row execute function public.set_consultations_updated_at();
