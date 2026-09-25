-- WhatsApp site-help fallback number (idempotent — safe to re-run).
--
-- The app reads clinic_settings.whatsapp_number for the persistent
-- "Trouble with the site? WhatsApp us" link (a wa.me deep link with a
-- prefilled message). Run this once in the Supabase SQL editor; afterwards
-- the number can be changed any time from the Doctor Portal → Clinic
-- Settings dialog (or by updating this column) with no code deploy.

alter table public.clinic_settings
  add column if not exists whatsapp_number text default '254182528510';

update public.clinic_settings
  set whatsapp_number = '254182528510'
  where whatsapp_number is null or whatsapp_number = '';
