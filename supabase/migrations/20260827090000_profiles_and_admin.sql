-- Comrades Clinic — user profiles + admin management
--
-- Defines public.profiles, the table the doctor portal login already checks
-- (full_name / role / kmpdc_license), and extends it with an 'admin' role for
-- the new admin console (/admin): manage doctor & patient accounts.
--
-- Roles: 'patient' (default) | 'doctor' | 'admin'
--
-- Apply manually via the Supabase SQL editor (not part of the app deploy).
-- Idempotent: safe to run on projects that already have a profiles table.

-- 1. Table (compatible with an existing hand-created profiles table) --------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text default 'patient',
  kmpdc_license text,
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists kmpdc_license text;
alter table public.profiles add column if not exists created_at timestamptz default now();

update public.profiles set role = 'patient' where role is null;
update public.profiles set created_at = now() where created_at is null;

do $$
begin
  alter table public.profiles
    add constraint profiles_role_check check (role in ('patient', 'doctor', 'admin'));
exception
  when duplicate_object then null;
end $$;

create index if not exists profiles_role_idx on public.profiles (role);

-- 2. Auto-create a profile for every new auth user ---------------------------
-- Patients sign up with email OTP; without this trigger they would have no
-- profile row and could never be promoted/managed from the admin console.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'patient'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Row Level Security -------------------------------------------------------
-- Matches the app's documented transitional posture (the doctor portal still
-- uses the anon key server-side). Role changes are additionally enforced in
-- the app's admin server functions, which require an admin session cookie.

alter table public.profiles enable row level security;

drop policy if exists "profiles app access" on public.profiles;
create policy "profiles app access"
  on public.profiles for all
  to anon, authenticated
  using (true)
  with check (true);

-- 4. Realtime -----------------------------------------------------------------
-- Lets the admin console see profile changes live (optional but consistent
-- with consultations/messages).

do $$
begin
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null;
  end;
end $$;
