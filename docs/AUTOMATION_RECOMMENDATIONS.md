# Automation recommendations

## What the repository does today

The app is a strong interactive prototype with separate patient and doctor views, rule-based triage, a simulated M-Pesa step, an in-memory consultation queue, chat, lab flags, prescriptions, referrals, and print-friendly documents.

The important limitation is that `src/lib/clinic-store.tsx` holds all clinic data in browser memory. A refresh resets it, two browsers do not share state, and no backend currently protects or persists patient data. M-Pesa and PDFs are also simulations. Those constraints determine the recommended order below.

## Priority 0 — data and access foundations

These should come before workflows that send real patient information.

### 1. Supabase persistence, Realtime, and row-level security

**Trigger:** any session, message, payment, or clinical record change.

**Automation:** write to Postgres and publish updates through Supabase Realtime so the patient and doctor see the same queue and chat without refreshing.

Suggested tables:

- `profiles` with `user_id`, `role`, `full_name`, and clinician license fields
- `consultations` with patient intake, triage, status, assigned doctor, payment status, and timestamps
- `messages` linked to a consultation
- `payments` with provider IDs, receipt, amount, and webhook payload status
- `clinical_notes`, `prescriptions`, `referrals`, and `lab_orders`
- `audit_events` as an append-only record of sensitive actions

Enforce RLS so patients can access only their own consultation, doctors can access assigned/queued records, and only clinicians can alter clinical outputs. Never rely on hiding a route in React as the data authorization boundary.

### 2. Production doctor identity and authorization

The current portal now requires a server-validated login and encrypted HTTP-only session. It intentionally supports one environment-configured doctor account because the rest of the app is still a mock.

For production, replace that account with Supabase Auth or another managed identity provider:

- individual clinician accounts rather than shared credentials
- a server-verified `doctor` role and active/employment status
- MFA for clinicians
- password reset and account invitation flows
- forced session expiry and revocation
- login throttling and suspicious-login alerts
- audit events for login, record view, note change, prescription, referral, and export

Every future server function that reads or changes a consultation should independently enforce the authenticated clinician role.

## Priority 1 — revenue and queue automation

### 3. M-Pesa Daraja payment lifecycle

**Trigger:** patient submits valid intake.

**Automation:** create a pending payment, initiate an STK Push, poll briefly for status, and let a signed callback/webhook become the authoritative payment result.

On a valid success callback:

1. Store the provider transaction ID and receipt idempotently.
2. Mark the consultation paid exactly once.
3. Move it into `waiting`.
4. Notify an available doctor.
5. Send the patient a receipt/queue confirmation.

Also automate cancellation, timeout, duplicate callbacks, incorrect amount, and daily reconciliation against M-Pesa records. Never activate a consultation only because the browser says payment succeeded.

### 4. Smart queue assignment and escalation

**Trigger:** payment confirmed or triage level changes.

**Automation:** rank the queue by emergency/urgent status, wait time, and clinician availability; then assign or alert the next suitable doctor.

Useful rules:

- immediately show emergency guidance; telemedicine must not delay emergency care
- page an available clinician for red-flag records
- alert staff when an urgent patient is not accepted within a target time
- tell the patient when the clinic is offline and estimate the next response window
- requeue safely if a doctor disconnects
- mark abandoned consultations after a configurable period, never silently delete them

Keep triage deterministic and clinically reviewed. Do not let an LLM autonomously diagnose, prescribe, or downgrade an emergency.

### 5. Transactional SMS/WhatsApp notifications

**Trigger:** meaningful state transitions.

Automate messages for:

- payment received or failed
- entered queue and doctor joined
- unread doctor reply after a short delay
- consultation completed
- prescription, referral, or lab order ready through an authenticated link
- follow-up due

Use neutral wording on lock screens and do not include symptoms, diagnoses, medication, or other sensitive details in notification previews.

## Priority 2 — clinical workflow automation

### 6. Clinical safety checks

**Trigger:** doctor prepares a prescription or referral.

**Automation:** require allergies, current medications, age, pregnancy status where relevant, and key contraindication fields; then run interaction, allergy, dose-range, and duplicate-medication checks before signing.

Warnings should support—not replace—clinical judgment. Record who overrode a warning and why. Require a diagnosis/assessment and confirmation before ending a session.

### 7. Document generation and delivery

**Trigger:** doctor signs a prescription or referral.

**Automation:** generate an immutable PDF on the server containing the consultation reference, issue time, clinician identity, verified KMPDC number, clinic contact details, and a document verification code/QR link.

Store the final artifact securely, retain its hash/version, and provide an expiring authenticated download. The current browser print action is useful for the mock but is not an authoritative clinical document workflow.

### 8. Lab order lifecycle

**Trigger:** clinician confirms a lab request.

**Automation:** create a structured lab order, notify the collection point, track `ordered → collected → processing → resulted → reviewed`, alert the clinician when results arrive, and alert/escalate unreviewed critical values.

Do not expose results to a patient until the release policy and clinician review rules permit it.

### 9. Follow-up and continuity

**Trigger:** consultation closes.

**Automation:** schedule a condition-appropriate check-in (for example 24–72 hours), medication reminders only with patient consent, and escalation when symptoms worsen or the patient reports a red flag. Reopen into a new linked consultation rather than editing a signed historic record.

## Priority 3 — reliability and business operations

### 10. Operational dashboards and alerts

Track and alert on:

- STK Push and webhook failure rate
- paid-to-doctor response time
- queue age by triage level
- dropped Realtime connections and undelivered notifications
- consultations closed without a clinical disposition
- document-generation and lab-result delivery failures

Use privacy-safe identifiers in application logs. Send exceptions to an observability service with patient text and phone numbers redacted.

### 11. Automated reconciliation and reports

Run scheduled jobs to reconcile M-Pesa totals with successful consultations, flag paid-but-unserved cases for follow-up/refund review, report clinician workload and response SLAs, and monitor consultation outcomes. Restrict exports by role and audit every export.

### 12. CI/CD and dependency automation

The repository currently has lint and build scripts but no tests or CI workflow. Add:

1. `typecheck`, unit-test, and end-to-end-test scripts.
2. Pull-request checks for formatting, lint, TypeScript, tests, and production build.
3. Playwright flows for intake → payment callback → queue → doctor login → chat → signed output.
4. Unit tests for triage rules, webhook signature/idempotency, RLS expectations, and clinical status transitions.
5. Dependency update automation with grouped, reviewed updates and vulnerability scanning.
6. Preview deployment smoke tests that verify protected routes are not accessible anonymously.

## Suggested implementation sequence

1. Supabase schema, Auth, RLS, and audit events.
2. Move the clinic store behind a repository/service API and add Realtime subscriptions.
3. Implement M-Pesa server endpoints, callbacks, idempotency, and reconciliation.
4. Add transactional notifications and queue SLA jobs.
5. Add server-generated signed documents and the lab lifecycle.
6. Add follow-up workflows, metrics, and deeper clinical safety checks.
7. Introduce higher-assurance CI/end-to-end coverage before production launch.

This ordering prevents automating sensitive workflows on top of browser-only state or client-trusted payment/authentication decisions.
