-- Comrades Clinic — consultation mode chosen at intake
--
-- Adds consultations.consultation_mode, the option a patient picks while
-- registering ("chat" = encrypted text chat, "video" = on-request Jitsi
-- voice/video call — see 20260825120000_video_call_jitsi_rooms.sql).
-- The choice is surfaced to the doctor in the queue and pre-highlights the
-- call affordances for the patient.
--
-- Apply manually via the Supabase SQL editor (not part of the app deploy).
-- Idempotent: safe to run more than once.

alter table public.consultations
  add column if not exists consultation_mode text not null default 'chat';

-- Guard the two allowed values (no-op when the constraint already exists).
do $$
begin
  alter table public.consultations
    add constraint consultations_consultation_mode_check
    check (consultation_mode in ('chat', 'video'));
exception
  when duplicate_object then null;
end $$;

comment on column public.consultations.consultation_mode is
  'Consultation preference chosen at intake: ''chat'' (default) or ''video'' for an on-request Jitsi voice/video call.';

-- consultations is already on the supabase_realtime publication, so the
-- choice syncs to the doctor portal without extra setup.
