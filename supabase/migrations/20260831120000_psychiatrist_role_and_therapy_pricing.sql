alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('patient','doctor','admin','psychiatrist'));

alter table consultations add column if not exists consultation_type text default 'general' check (consultation_type in ('general','therapy'));
alter table consultations add column if not exists assigned_to uuid references profiles(id) on delete set null;
alter table consultations add column if not exists fee_kes integer default 150;

alter table clinic_settings add column if not exists therapy_fee_kes integer default 250;
update clinic_settings set therapy_fee_kes = 250 where therapy_fee_kes is null;

create index if not exists consultations_type_idx on consultations(consultation_type);
create index if not exists consultations_assigned_idx on consultations(assigned_to);

create or replace function is_clinic_staff(user_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = user_id and role in ('doctor','admin','psychiatrist') and is_active = true
  );
$$;
