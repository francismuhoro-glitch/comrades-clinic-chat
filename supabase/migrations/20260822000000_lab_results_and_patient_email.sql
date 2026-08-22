-- Comrades Clinic — Lab results, lab test catalog, and patient email migration

-- 1. Patient email column on consultations + index
alter table public.consultations add column if not exists patient_email text;
create index if not exists consultations_patient_email_idx on public.consultations (lower(patient_email));

-- 2. Foreign key on delete set null for patient_id
alter table public.consultations drop constraint if exists consultations_patient_id_fkey;
alter table public.consultations
  add constraint consultations_patient_id_fkey
  foreign key (patient_id) references auth.users (id) on delete set null;

-- 3. Lab Test Catalog
create table if not exists public.lab_test_catalog (
  loinc_code text primary key,
  display_name text not null,
  specimen text,
  common_unit text,
  reference_range text,
  active boolean default true
);

alter table public.lab_test_catalog enable row level security;

drop policy if exists "catalog read policy" on public.lab_test_catalog;
create policy "catalog read policy"
  on public.lab_test_catalog for select
  to anon, authenticated
  using (true);

insert into public.lab_test_catalog (loinc_code, display_name, specimen, common_unit, reference_range)
values
  ('58410-2', 'Complete Blood Count (CBC)', 'Whole Blood', '10^3/uL', '4.0-10.0'),
  ('718-7', 'Hemoglobin', 'Whole Blood', 'g/dL', '12.0-16.0'),
  ('6690-2', 'White Blood Cells (WBC)', 'Whole Blood', '10^3/uL', '4.0-11.0'),
  ('777-3', 'Platelets', 'Whole Blood', '10^3/uL', '150-450'),
  ('32700-7', 'Malaria Smear', 'Capillary/Whole Blood', 'qualitative', 'Negative'),
  ('24356-8', 'Urinalysis Panel', 'Urine', 'qualitative', 'Normal'),
  ('10701-1', 'Stool Ova & Parasites', 'Stool', 'qualitative', 'Negative'),
  ('17780-8', 'H. pylori Antigen', 'Stool', 'qualitative', 'Negative'),
  ('1558-6', 'Fasting Blood Glucose', 'Plasma', 'mmol/L', '3.9-5.6'),
  ('2106-3', 'hCG Urine (Pregnancy Test)', 'Urine', 'qualitative', 'Negative'),
  ('1988-5', 'C-Reactive Protein (CRP)', 'Serum', 'mg/L', '< 5.0')
on conflict (loinc_code) do nothing;

-- 4. Lab Results Table
create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid references public.consultations(id) on delete cascade,
  panel text,
  result_value text,
  unit text,
  reference_range text,
  flag text default 'normal' check (flag in ('normal', 'low', 'high', 'critical')),
  notes text,
  stage text default 'pending' check (stage in ('pending', 'collected', 'processing', 'resulted', 'reviewed')),
  loinc_code text,
  loinc_display text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lab_results_consultation_id_idx on public.lab_results(consultation_id);

alter table public.lab_results enable row level security;

drop policy if exists "lab results access" on public.lab_results;
create policy "lab results access"
  on public.lab_results for all
  to anon, authenticated
  using (true)
  with check (true);

do $$
begin
  begin
    alter publication supabase_realtime add table public.lab_results;
  exception when duplicate_object then null;
  end;
end $$;
