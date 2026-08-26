-- Comrades Clinic — web push subscriptions
--
-- One row per browser/endpoint that allowed notifications. The server reads
-- this table to fan out web pushes when an in-app notification is written.
-- VAPID keys are configured on the server (VITE_VAPID_PUBLIC_KEY /
-- VAPID_PRIVATE_KEY) — without them, pushes are skipped and only the in-app
-- bell works.
--
-- Apply manually via the Supabase SQL editor (not part of the app deploy).
-- Idempotent.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  role text not null check (role in ('patient', 'doctor')),
  recipient_id uuid references auth.users (id) on delete cascade,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists push_subscriptions_role_idx
  on public.push_subscriptions (role, recipient_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions app access" on public.push_subscriptions;
create policy "push_subscriptions app access"
  on public.push_subscriptions for all
  to anon, authenticated
  using (true)
  with check (true);
