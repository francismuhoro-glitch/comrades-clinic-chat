-- Comrades Clinic — scheduled appointment booking
--
-- Students can pre-book a consult slot with the clinic instead of only using
-- the walk-in queue. Requests start as 'pending'; the doctor confirms or
-- declines from the portal. Confirmed/pending slots block their time cell.
--
-- Statuses: pending | confirmed | declined | completed | cancelled
--
-- Apply manually via the Supabase SQL editor (not part of the app deploy).
-- Idempotent.

-- 1. Table --------------------------------------------------------------------

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  patient_phone text not null,
  patient_email text,
  -- Auth account of the patient when logged in (lets notifications reach the
  -- student's bell on any device).
  patient_id uuid references auth.users (id) on delete set null,
  campus text,
  reason text,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'declined', 'completed', 'cancelled')),
  consultation_id uuid references public.consultations (id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists appointments_slot_idx on public.appointments (slot_start);
create index if not exists appointments_status_idx on public.appointments (status, slot_start);

-- 2. Row Level Security -------------------------------------------------------
-- Matches the app's documented transitional posture.

alter table public.appointments enable row level security;

drop policy if exists "appointments app access" on public.appointments;
create policy "appointments app access"
  on public.appointments for all
  to anon, authenticated
  using (true)
  with check (true);

-- 3. Realtime -----------------------------------------------------------------
-- Live updates for the doctor's bookings tab and the booking page's taken slots.

do $$
begin
  begin
    alter publication supabase_realtime add table public.appointments;
  exception when duplicate_object then null;
  end;
end $$;
