# Supabase setup

The app runs fully in-browser without Supabase (mock mode), but **cross-device
sync, live updates between doctor and patient, and patient accounts all require
a configured Supabase project**.

## 1. Create the schema

Open your Supabase project → SQL Editor → run
[`supabase/migrations/20260821120000_clinic_schema_patient_accounts.sql`](../supabase/migrations/20260821120000_clinic_schema_patient_accounts.sql).

It is idempotent — safe to run even if you already created `consultations`,
`messages`, or `clinic_settings` earlier. It also:

- adds the `patient_id` column used by patient accounts,
- enables Row Level Security with transitional policies,
- adds `consultations` and `messages` to the **Realtime** publication (this is
  what makes the doctor's "Request lab test" appear instantly on the patient's
  phone).

## 2. Enable email OTP sign-in (patient accounts)

Dashboard → **Authentication → Sign In / Up → Email**:

- Enable the **Email** provider.
- The app uses **6-digit OTP codes** (`signInWithOtp` + `verifyOtp`), so make
  sure the _Magic Link / OTP_ email template includes the `{{ .Token }}`
  variable (the default template does).
- For production volume, configure a custom SMTP provider under
  **Authentication → Emails → SMTP** — the built-in sender is rate-limited to a
  few emails per hour.

## 3. Environment variables

Set these wherever the app is built (Vercel → Project → Settings → Environment
Variables). `VITE_*` variables are baked in **at build time**, so redeploy
after changing them.

| Variable                           | Where to find it                                    |
| ---------------------------------- | --------------------------------------------------- |
| `VITE_SUPABASE_URL`                | Supabase → Settings → API → Project URL             |
| `VITE_SUPABASE_ANON_KEY`           | Supabase → Settings → API → anon public key         |
| `SESSION_SECRET`                   | generate: `openssl rand -base64 48` (doctor portal) |
| `DOCTOR_EMAIL` / `DOCTOR_PASSWORD` | doctor portal credentials                           |

## 4. What works without Supabase

- The full single-browser demo (RoleSwitcher between patient and doctor views).
- Everything is kept in memory; a refresh reseeds mock data.

With Supabase configured you additionally get:

- Doctor ↔ patient live sync across devices (chat, queue, lab requests,
  lab-order decisions, payment confirmations).
- Chat history restored after refresh (messages are stored AES-encrypted).
- Patient sign-in (email OTP) and the **My Visits** page (`/visits`), including
  linking pre-account visits by phone number.
- On-request voice/video calls (Jitsi) during active consultations — see
  section 5 below.

## 5. Voice & video calls (Jitsi)

During an active consultation, either side can start an on-request
voice/video call. Calls ride on the **public meet.jit.si instance** — there is
no API key, no JWT, and **no environment variable to configure**. Chat is
unaffected: calls are offered alongside, never instead of, the encrypted text
chat, and if video can't be opened the UI falls back to
"video unavailable — continue via chat".

How rooms work:

- Room names are generated **server-side** (a TanStack server function), are
  unguessable, and are assigned **exactly once per consultation**, stored in
  `consultations.video_room_name`. Clients never choose room names.
- Access is enforced two ways: the doctor is authorised by their session
  cookie (server function), and a signed-in patient may only fetch the room of
  their **own** consultation — the `get_video_room_name()` RPC enforces
  `consultations.patient_id = auth.uid()` inside Postgres.
- Calls start **audio-first** with an explicit "Enable video" toggle, and the
  call is hung up + unmounted as soon as the consultation completes.

To enable calls, run
[`supabase/migrations/20260825120000_video_call_jitsi_rooms.sql`](../supabase/migrations/20260825120000_video_call_jitsi_rooms.sql)
in your Supabase project → **SQL Editor**. This migration must be **applied
manually — it is not part of the app deploy**. It is idempotent and:

- adds the `consultations.video_room_name` column,
- creates the ownership-enforcing `get_video_room_name(p_consultation_id)` RPC
  (executable by authenticated users only).

Patients can also **choose their consultation preference while registering**
(intake): "Text chat" or "Voice/video call". The choice is stored in
`consultations.consultation_mode`, shown as a "Wants voice/video" badge in the
doctor's queue, and pre-highlights the call affordances for the patient. To
store it, also run
[`supabase/migrations/20260826090000_consultation_mode.sql`](../supabase/migrations/20260826090000_consultation_mode.sql)
in the SQL editor (idempotent, applied manually like the one above). Until
these migrations are applied the app keeps working; starting a call simply
ends in the chat fallback.

**If calls report "the call room did not respond in time":** your network or
browser is blocking the embedded meet.jit.si room (some networks, Safari
private mode, and strict ad-blockers do). Options: use the **"Open in new
tab"** button shown in the call window — it opens the same room directly —
or point the whole app at a different Jitsi instance by setting the optional
`VITE_JITSI_DOMAIN` variable (e.g. your own self-hosted Jitsi) and
redeploying. No keys are required either way.

**How the call opens, by domain:** on the default **meet.jit.si** the room
opens in its **own browser tab** — meet.jit.si disconnects rooms _embedded_
in an iframe after ~5 minutes ("demo purposes"), while tab-based rooms have
no such limit, and a new tab works on every host and browser. If you set
`VITE_JITSI_DOMAIN` to your own self-hosted instance (or a JAAS app), calls
**embed inside the app** instead — self-hosted instances have no 5-minute
embedding restriction.

## 6. User profiles & admin console

Doctor logins check a `profiles` table (`full_name`, `role`, `kmpdc_license`).
To define it properly and unlock the admin console at **/admin**, run
[`supabase/migrations/20260827090000_profiles_and_admin.sql`](../supabase/migrations/20260827090000_profiles_and_admin.sql)
in the SQL editor. It creates (or upgrades) `profiles`, auto-creates a profile
for every new account, and adds an **admin** role.

Becoming an admin:

1. Sign up once via **My Visits** with your email (or use your existing doctor
   account).
2. In Supabase → SQL editor, run:
   `update public.profiles set role = 'admin' where email = 'you@clinic.ac.ke';`
3. Sign in on **/doctor** — an **Admin** button now opens the console, where
   you can list users, change roles, edit names/licenses, and create doctor
   accounts (the last one requires the optional `SUPABASE_SERVICE_ROLE_KEY`
   server env var).

## 7. Notification bell

Run [`supabase/migrations/20260827120000_notifications.sql`](../supabase/migrations/20260827120000_notifications.sql)
in the SQL editor to create the `notifications` table (with realtime enabled).
The 🔔 bells in the student header and doctor portal then deliver live alerts —
new patient in queue, payment to verify, doctor is ready, prescription/lab/referral
updates. No extra API keys required.

## 8. PWA & background push

The app is an installable PWA (manifest, icons, offline fallback, service
worker). To deliver **background push** ("doctor is ready!" with all tabs
closed), run
[`supabase/migrations/20260827150000_push_subscriptions.sql`](../supabase/migrations/20260827150000_push_subscriptions.sql)
in the SQL editor, then set `VAPID_PRIVATE_KEY` (+ optionally
`VITE_VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`) on the server — generation
instructions are in `.env.example`. Without the private key the in-app bell
still works; pushes are simply skipped.

## Security roadmap

The migration ships transitional permissive policies so the current
anon-key-based doctor portal keeps working. Before handling real patient data:

1. Move the doctor onto Supabase Auth with a verified `doctor` role.
2. Replace the permissive `clinic app access` policies with role-scoped ones
   (patients: own rows only; doctors: assigned/queued rows).
3. Move message encryption keys out of the client (currently derived from the
   consultation id).
