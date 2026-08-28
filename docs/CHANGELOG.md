# COMRACARE — Changelog & Operations Runbook

Consolidated record of the August 2026 upgrade wave. Every feature below is
merged into `main` and deployed by Vercel on merge.

## Shipped features

| PR      | Feature                | What it does                                                                                                       | Setup                                                                                                          |
| ------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| #17     | Admin console `/admin` | Manage users/doctors: roles, names, KMPDC licenses, create doctor accounts                                         | Run migration `20260827090000`; promote yourself: `update public.profiles set role='admin' where email='you';` |
| #17     | Queue date filter      | Today / 7 days / 30 days / All time above the doctor's queue tabs                                                  | —                                                                                                              |
| #17     | Landing refresh        | Student-focused hero, services grid incl. voice/video calls                                                        | —                                                                                                              |
| #18     | Notification center    | Live 🔔 bells for students + doctors (new patient, payment, doctor ready, Rx/lab/referral updates)                 | Run `20260827120000`                                                                                           |
| #19     | Mental wellness module | Mood check-in (PHQ-2/GAD-2-based, device-local), `/wellness` hub with verified crisis lines, gentle doctor handoff | None                                                                                                           |
| #20     | Smart triage           | Dynamic follow-up questions, red-flag screeners, auto-escalation, pre-consult summary card                         | Run `20260827130000`                                                                                           |
| #21     | Appointment booking    | `/book` 7-day EAT slot grid, doctor Bookings tab with confirm/decline, reminders via bells                         | Run `20260827140000`                                                                                           |
| #22     | PWA + web push         | Installable app, offline page, background push (zero-dependency VAPID implementation)                              | Run `20260827150000`; set `VAPID_PRIVATE_KEY` on Vercel                                                        |
| #23     | Install button         | One-tap PWA install in both headers (captures `beforeinstallprompt`)                                               | —                                                                                                              |
| #24/#25 | Push UX fixes          | Vibration + renotify + high-urgency delivery                                                                       | —                                                                                                              |
| #26     | Doctor email alerts    | Email to the doctor's login address on new queue patients + M-Pesa claims (Brevo)                                  | Same Brevo keys as visit reports; optional `SITE_URL`                                                          |

## Supabase migrations — run in this order

SQL editor only (never automated). All are idempotent.

1. `20260821120000_clinic_schema_patient_accounts.sql`
2. `20260822000000_lab_results_and_patient_email.sql`
3. `20260822100000_facility_read_policies.sql`
4. `20260825120000_video_call_jitsi_rooms.sql`
5. `20260826090000_consultation_mode.sql`
6. `20260827090000_profiles_and_admin.sql`
7. `20260827120000_notifications.sql`
8. `20260827130000_smart_triage_answers.sql`
9. `20260827140000_appointments.sql`
10. `20260827150000_push_subscriptions.sql`

## Environment variables (Vercel)

| Variable                                       | Required            | Purpose                                                              |
| ---------------------------------------------- | ------------------- | -------------------------------------------------------------------- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | yes                 | Database, auth, realtime                                             |
| `SESSION_SECRET`                               | yes                 | Doctor portal sessions (≥32 chars)                                   |
| `DOCTOR_EMAIL` / `DOCTOR_PASSWORD`             | fallback            | Seeded clinician login                                               |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL`         | for email           | Visit reports + doctor email alerts                                  |
| `VAPID_PRIVATE_KEY`                            | for background push | Web push signing (pair with built-in public key; see `.env.example`) |
| `VITE_VAPID_PUBLIC_KEY`                        | optional            | Override the deployed public push key                                |
| `VAPID_SUBJECT`                                | optional            | mailto: contact in the VAPID JWT                                     |
| `SITE_URL`                                     | optional            | Portal button links in alert emails                                  |
| `SUPABASE_SERVICE_ROLE_KEY`                    | optional            | One-click doctor account creation in `/admin`                        |
| `VITE_JITSI_DOMAIN`                            | optional            | Self-hosted Jitsi → embedded calls                                   |

## Roadmap (chosen by the owner)

Remaining: **#9 analytics dashboard** (in `/admin`) · **#11 referral program**.
Done: notifications, mental health, smart triage, booking, PWA+push — plus the
owner-requested doctor email alerts.
