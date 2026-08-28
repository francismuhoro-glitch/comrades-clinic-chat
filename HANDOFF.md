# HANDOFF — COMRACARE Student Clinic (read this first, new session)

Date of handoff: 2026-08-28. Written by the outgoing Arena coding session so the next one doesn't get confused.

## 1. What this project is

COMRACARE Student Clinic — a mobile-first telemedicine PWA for Kenyan university students
("comrades"). Students pay KSh 150 via M-Pesa (Pochi la Biashara, manual code verification for
now), consult a licensed doctor by encrypted chat or Jitsi voice/video, and receive
prescriptions, lab orders or referral letters. Stack: TanStack Start (React) + Supabase +
Tailwind/shadcn + Vercel (auto-deploys on merge to `main`).

Repo: `francismuhoro-glitch/comrades-clinic-chat` · working dir: `/home/user/comrades-clinic-chat`.
State at handoff: `main` @ `73179b3`, worktree clean, ALL PRs (#17–#27) merged, no open PRs,
no unmerged branches. GitHub access ENDED for the outgoing session — branch fresh from
`origin/main` and push from there. First PR should also commit this handoff (there is a copy
at the repo root as HANDOFF.md, or fold it into docs/CHANGELOG.md).

## 2. IMMEDIATE TASKS (owner-approved, in order)

1. **Remove the demo seed patients** (owner request after a false alarm: he thought a patient
   "bypassed" the queue — it was demo data). `src/lib/clinic-store.tsx` seeds 3 hardcoded fake
   sessions near the top (Brian Otieno, Mercy Kamau, **Kelvin Kiprop** — the last is
   status `completed`). They appear on every device and pollute the live queue and future
   analytics. Strip the seed block; keep the Supabase loader as the only data source; empty
   states in the UI already exist.
2. **Feature #9 — Analytics dashboard** inside `/admin` (owner chose it from a roadmap):
   consults/day, revenue (KSh 150 × confirmed payments), top symptoms (symptom_codes),
   triage mix, response times (created→activated), completion stats. Data source:
   `consultations` table. Do it AFTER the demo-seed removal so numbers are real.
3. **Feature #11 — Referral program**: student referral codes, invite flow, campus
   ambassadors, first-consult discount hook. Owner picked it; no detailed spec yet —
   propose a design in the PR description like previous features.

Per-feature workflow that has worked all along: `git checkout -b feat/<name> origin/main` →
build → gates (see §5) → `git add` exactly the intended files → commit → push →
`gh pr create` → wait for Vercel check → `gh pr merge --squash --delete-branch` →
sync local `main` → tell the owner to **redeploy + hard-refresh**, and to **run any new
migration in the Supabase SQL editor** (owner runs all SQL manually).

## 3. STANDING RULES (owner-set, never break these)

- **Never commit or re-commit:** `package.json`, `package-lock.json` (leave the dirty
  package-lock from `npm install` OUT of commits), `src/lib/facilities.ts`,
  `public/facilities.json`, `scripts/import-facilities.mjs`.
- **Migrations ship as files only** in `supabase/migrations/` — NEVER run SQL against the
  owner's database. Owner runs them by hand in the SQL editor.
- **Never touch** the `messages` table / chat flow / end-to-end encryption
  (`src/lib/crypto.ts`, message persist paths in `clinic-store.tsx`).
- Gates must pass BEFORE committing: `npx tsc --noEmit` (0 errors), `npm run lint`
  (0 errors; 6 pre-existing warnings are OK), `npm run build` (passes), prettier on touched
  files. Run `npm install` first or npx pulls wrong packages.
- Never force-push; never commit directly to `main`.
- Theme: youthful but clinical/trustworthy (teal `oklch(0.54 0.115 213)`), tokens in
  `src/styles.css`. Audience = university students; it is a hospital system.

## 4. What shipped in the Aug 2026 wave (all merged & owner-verified live)

| PR      | Feature                                                                                                                         | Key files                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| #17     | Admin console `/admin`, queue date filter (Today/7d/30d/All), landing refresh                                                   | `src/routes/admin.tsx`, `src/lib/admin-users.ts`, doctor-auth roles              |
| #18     | Live 🔔 notification center (patient + doctor audiences, realtime)                                                              | `src/lib/notifications.ts`, `NotificationBell.tsx`                               |
| #19     | Mental wellness: mood check-in on landing (PHQ-2/GAD-2-based, device-local), `/wellness` hub, intake preselect handoff          | `MoodCheckIn.tsx`, `src/routes/wellness.tsx`, `src/lib/wellness.ts`              |
| #20     | Smart triage: dynamic follow-up questions, red-flag screeners → auto-escalate to emergency, pre-consult summary card for doctor | `src/lib/smart-triage.ts`, IntakeForm step 3, ClinicalPanel card                 |
| #21     | Appointment booking `/book` (7-day EAT grid) + doctor Bookings tab (confirm/decline)                                            | `src/lib/appointments.ts`, `src/routes/book.tsx`                                 |
| #22     | PWA (manifest/icons/offline/sw) + background web push with ZERO dependencies (hand-rolled RFC 8291/8292 on node:crypto)         | `public/sw.js`, `src/lib/web-push-crypto.ts`, `push-server.ts`, `push-client.ts` |
| #23–#25 | Install button (beforeinstallprompt), push vibration/renotify, high-urgency                                                     | sw.js, web-push-crypto                                                           |
| #26     | Doctor EMAIL alerts on new patient + M-Pesa claim (Brevo; recipients = doctor/admin profile emails, fallback `DOCTOR_EMAIL`)    | `src/lib/doctor-email-alerts.ts`, two call sites in clinic-store                 |
| #27     | `docs/CHANGELOG.md` — feature table, migration run-order, env checklist                                                         | docs/CHANGELOG.md                                                                |

Migrations on disk (owner may have run all): `20260821120000` (schema), `20260822000000`
(lab results), `20260822100000` (facility reads), `20260825120000` (jitsi rooms),
`20260826090000` (consultation_mode), `20260827090000` (profiles+admin),
`20260827120000` (notifications), `20260827130000` (triage_answers jsonb),
`20260827140000` (appointments), `20260827150000` (push_subscriptions).

## 5. Sandbox gotchas (hit by the outgoing session — don't re-hit)

- **node_modules is NOT persisted** between sessions → run `npm install` first or every
  gate fails weirdly (`npx tsc` installs a fake package; prettier "No parser").
- **Stale worktree after branch deletions**: if `git status` shows merged files as
  modified/untracked, the checkout is stale. Safe repair (everything is on origin):
  `git stash -u` (paranoia) → `git checkout -f main` → `git reset --hard origin/main`.
  NEVER reset with real uncommitted work — commit or stash first.
- `edit_file` intermittently fails ("Something went wrong") or silently drops params —
  always pass explicit `path`, retry individually, or patch via `python3` heredocs (reliable).
- `vite preview` crashes in sandbox — smoke-test with `npm run dev` (port 8080, bind
  0.0.0.0) + curl instead.
- exactOptionalPropertyTypes is ON: never assign explicit `undefined` to optional props;
  forward with `| undefined` in the type or conditionally spread.
- lucide-react icon names: verify before use (`People` doesn't exist; use `Users`).
- Supabase realtime payload types don't narrow on `event: "*"` — register separate
  INSERT/UPDATE/DELETE handlers (see appointments.ts / clinic-store.tsx).

## 6. Ops knowledge (owner's live environment)

- Owner/admin: **francismurageweb@gmail.com** (profiles id `ee571d50-842a-46ae-b5b5-c0165dd1b287`,
  role admin). Other accounts: fmurage6331@stu.kemu.ac.ke, francis.muhoro@cuk.ac.ke (patients).
  Quirk: one hand-created profile row had `email = null` — backfill already done.
- **Brevo email**: works NOW. Root cause of the earlier outage: the `BREVO_API_KEY` on Vercel
  was from a different Brevo account than the verified sender. Lesson: key (`xkeysib-…`) and
  `BREVO_SENDER_EMAIL` must belong to the SAME Brevo account. Brevo → Transactional → Logs is
  the ground truth for delivery debugging.
- **Web push**: public VAPID key is baked into `push-server.ts` + `push-client.ts`
  (FALLBACK_VAPID_PUBLIC_KEY). The matching private key is set as `VAPID_PRIVATE_KEY` on
  Vercel (owner did this). If regenerating: one-liner in `.env.example`; set BOTH sides or
  subscriptions break. Push delivery confirmed end-to-end by the owner; "no buzz" issues were
  Android notification-channel settings, not code.
- Jitsi calls: default meet.jit.si opens in a NEW TAB (by design — embeds get killed in
  5 min). Self-hosted `VITE_JITSI_DOMAIN` switches to embedded mode. Don't "fix" this.
- Install prompt: captured `beforeinstallprompt`, one-tap install button in both headers.

## 7. How to work with the owner (communication)

- He's non-technical, decisive, and uses short/caps messages ("BUILD", "IT IS OKAY NOW").
  He tests on his phone and reports symptoms, not causes — diagnose from the code first.
- He likes: numbered step-by-step instructions (exact keys to click), tables for status,
  one PR per feature with a clear "Setup" section (which SQL to run), and a heads-up to
  **redeploy + hard refresh** after each merge.
- He verifies on the LIVE site after every feature. If he reports "X not working", first
  check: did he redeploy? did he run the migration? is it a phone-side setting?

## 8. Quick state check (run first)

```bash
cd /home/user/comrades-clinic-chat
git fetch origin && git status --short
git log origin/main --oneline -5
gh pr list --state open
npm install   # always, node_modules doesn't persist
npx tsc --noEmit && npm run lint 2>&1 | tail -1
```

Then start task §2.1 (demo seed removal), and commit this handoff file with that first PR.
