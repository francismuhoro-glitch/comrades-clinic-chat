-- Comrades Clinic — on-request Jitsi voice/video rooms
--
-- Applies the persistence + access-control side of the video feature:
--   * consultations.video_room_name — unguessable room assigned exactly once
--     per consultation by the app's server function (never by the client),
--   * get_video_room_name(p_consultation_id) — RPC that lets a signed-in
--     patient fetch the room ONLY for their own consultation
--     (consultations.patient_id = auth.uid()). Doctors never call this RPC;
--     they go through the server function, authorised by their session cookie.
--
-- Apply manually via the Supabase SQL editor (it is not part of the app
-- deploy). Idempotent: safe to run more than once.

-- 1. Room assignment column -------------------------------------------------

alter table public.consultations add column if not exists video_room_name text;

comment on column public.consultations.video_room_name is
  'Unguessable Jitsi room for the on-request voice/video call; assigned once per consultation server-side.';

-- 2. Ownership-enforcing read RPC --------------------------------------------
-- SECURITY DEFINER so the patient_id = auth.uid() check below is the single
-- gate: this keeps patients able to fetch their own room even after the
-- transitional permissive consultation policies (see
-- 20260821120000_clinic_schema_patient_accounts.sql) are tightened.

create or replace function public.get_video_room_name(p_consultation_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select c.video_room_name
  from public.consultations c
  where c.id = p_consultation_id
    and c.patient_id = auth.uid()
$$;

-- Only authenticated (signed-in) patients may execute it.
revoke all on function public.get_video_room_name(uuid) from public;
revoke all on function public.get_video_room_name(uuid) from anon;
grant execute on function public.get_video_room_name(uuid) to authenticated;

-- 3. Realtime ----------------------------------------------------------------
-- consultations is already on the supabase_realtime publication, so the
-- video_room_name assignment propagates live and the other side sees a
-- "Join call" affordance without refreshing. Nothing to do here.
