-- Facility uploads are public reference data used by patient triage and clinician referrals.
-- Keep this migration safe for projects that only have one of the supported table names.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['hospitals', 'facilities', 'campus_facilities'] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists "Anyone can read health facilities" on public.%I', table_name);
      execute format('create policy "Anyone can read health facilities" on public.%I for select using (true)', table_name);
    end if;
  end loop;
end $$;
