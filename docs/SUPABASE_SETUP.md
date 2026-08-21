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
  sure the *Magic Link / OTP* email template includes the `{{ .Token }}`
  variable (the default template does).
- For production volume, configure a custom SMTP provider under
  **Authentication → Emails → SMTP** — the built-in sender is rate-limited to a
  few emails per hour.

## 3. Environment variables

Set these wherever the app is built (Vercel → Project → Settings → Environment
Variables). `VITE_*` variables are baked in **at build time**, so redeploy
after changing them.

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SESSION_SECRET` | generate: `openssl rand -base64 48` (doctor portal) |
| `DOCTOR_EMAIL` / `DOCTOR_PASSWORD` | doctor portal credentials |

## 4. What works without Supabase

- The full single-browser demo (RoleSwitcher between patient and doctor views).
- Everything is kept in memory; a refresh reseeds mock data.

With Supabase configured you additionally get:

- Doctor ↔ patient live sync across devices (chat, queue, lab requests,
  lab-order decisions, payment confirmations).
- Chat history restored after refresh (messages are stored AES-encrypted).
- Patient sign-in (email OTP) and the **My Visits** page (`/visits`), including
  linking pre-account visits by phone number.

## Security roadmap

The migration ships transitional permissive policies so the current
anon-key-based doctor portal keeps working. Before handling real patient data:

1. Move the doctor onto Supabase Auth with a verified `doctor` role.
2. Replace the permissive `clinic app access` policies with role-scoped ones
   (patients: own rows only; doctors: assigned/queued rows).
3. Move message encryption keys out of the client (currently derived from the
   consultation id).
