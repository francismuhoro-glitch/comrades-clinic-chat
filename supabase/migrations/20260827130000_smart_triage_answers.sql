-- Comrades Clinic — smart triage: structured pre-consult answers
--
-- Adds a JSONB column to consultations holding the patient's answers to the
-- dynamic follow-up questions (duration, severity, red-flag screeners) asked
-- during intake. The doctor's clinical panel renders a pre-consult summary
-- from these answers; nothing about messages/chat changes.
--
-- Apply manually via the Supabase SQL editor (not part of the app deploy).
-- Idempotent.

alter table public.consultations
  add column if not exists triage_answers jsonb;
