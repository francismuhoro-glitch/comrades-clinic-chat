-- Comrades Clinic — in-app notification center
--
-- Powers the 🔔 bell for both sides of the clinic:
--   audience = 'doctor'  → broadcast rows every portal user sees (new patient
--                           in queue, payment to verify, lab declined, …)
--   audience = 'patient' → rows for one consultation (recipient_id = logged-in
--                           patient's auth id, or consultation_id for guests
--                           on the same device)
--
-- Apply manually via the Supabase SQL editor (not part of the app deploy).
-- Idempotent: safe to run more than once.

-- 1. Table --------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('patient', 'doctor')),
  -- For patient rows: the account to reach (null for guest/device-scoped rows).
  recipient_id uuid references auth.users (id) on delete cascade,
  -- Consultation the notification is about (used for device-scoped delivery
  -- and to give context in the UI).
  consultation_id uuid references public.consultations (id) on delete cascade,
  type text not null,
  title text not null,
  body text default '',
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_audience_idx
  on public.notifications (audience, created_at desc);
create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

-- 2. Row Level Security -------------------------------------------------------
-- Matches the app's documented transitional posture (single-clinic deployment;
-- role changes are enforced in the app's server functions).

alter table public.notifications enable row level security;

drop policy if exists "notifications app access" on public.notifications;
create policy "notifications app access"
  on public.notifications for all
  to anon, authenticated
  using (true)
  with check (true);

-- 3. Realtime -----------------------------------------------------------------
-- Live delivery to the notification bells.

do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;
