# Comrades Clinic Chat

Create a standalone, highly responsive mobile-first Telemedicine Web App called "Lovable Student Clinic" designed for Kenyan university students ("comrades"). The app allows students to pay a flat consultation fee of KSh 150 via M-Pesa to access a live, real-time text chat consultation with a doctor. If the case is basic, the doctor issues a digital prescription. If it is complex, the doctor generates a referral letter or flags them for a lab test.



Please build the entire app layout, state management, and user flows using mock data first, ensuring it is modular so I can easily swap out the frontend state for Supabase and actual M-Pesa API webhooks later.



### 🎨 Design & Layout Requirements

- Mobile-First Design: The student view must look like a clean, premium progressive web app (PWA) optimized for smartphones.

- Theme: Trustworthy, professional, and modern medical theme (clean whites, medical blues/teals, dark text).

- Navigation: Keep it simple. Avoid complex multi-tier menus.



### 🔄 App Structure & Pages



1. STUDENT LANDING & TRIAGE PAGE

- A welcoming header: "Lovable Student Clinic — Affordable Care for Comrades".

- A prominent status badge driven by global state: "🟢 Doctor is Online" or "🔴 Doctor is Offline (Emergency disclaimer displayed)".

- An Intake Form containing fields: Full Name, Phone Number (M-Pesa), University/Campus selection dropdown, and a textarea for "Describe your symptoms or reason for visit".

- Clear medical disclaimer checkbox: "I understand this service is for basic care only. For emergencies, I will visit a physical hospital immediately."

- A prominent "Start Consultation (KSh 150)" button.



2. M-PESA SIMULATION SCREEN

- When the student submits the form, show a modern loading/processing screen simulating an M-Pesa STK Push.

- Display text: "Sending KSh 150 STK Push to [Phone Number]... Please check your phone and enter your PIN."

- Provide a mock "Simulate Successful Payment" button so I can test the user flow. Once clicked, it updates the session state to "Paid" and automatically redirects them to the live chat room.



3. STUDENT LIVE CHAT & WRAP-UP ROOM

- A beautiful, real-time text chat window interface (similar to WhatsApp or Telegram).

- Show a header with "Dr. [Name] — Active Session".

- Include a simulated chat interaction where the student can type messages and see them appended instantly to the chat bubble list.

- When the session is closed by the doctor:

  - Immediately disable the chat input text box ("This session has ended").

  - Display a card containing a downloadable PDF mockup or a beautifully styled card for "Your Digital Prescription" or "Your Referral Letter" depending on the doctor's final action.



4. DOCTOR PORTAL DASHBOARD (Accessible via a separate route or persistent toggle switcher)

- Provide a persistent toggle at the very top of the app: "Switch to Doctor Dashboard View" so I can jump back and forth easily during development.

- A Master "Clinic Availability" Toggle: Clicking this switches the global state between Online and Offline, changing what students see on the landing page.

- Patient Queue Panel divided into 3 tabs:

  - "Waiting & Paid" (Students who just completed M-Pesa payment and need attention).

  - "Active Chats" (Current live consults).

  - "Completed" (Archived history).

- Split-Screen Active Chat Workspace (When a doctor clicks on a patient from the active queue):

  - Left Side: The live chat window mirroring the student's conversation, with an input area for the doctor to type replies.

  - Right Side: The Clinical Management Panel containing:

    - A "Diagnosis Notes" textarea.

    - Action Option A: "Issue Prescription" form with inputs for Medication Name, Dosage, and Duration, plus an "End Session & Send Prescription" submit button.

    - Action Option B: "Issue Referral" form with a textarea for the Destination Hospital/Reason, plus an "End Session & Send Referral Letter" submit button.

    - Action Option C: "Request Lab Test" checkbox/button which flags the patient file as "Needs Sample Collection".



### ⚙️ Technical Blueprint (For Later Supabase/Vercel Transfer)

- Use clean component splitting (e.g., separating `StudentLayout`, `DoctorLayout`, `ChatWindow`, `PrescriptionTemplate`).

- Isolate the state management for the chat messages and patient session status into a mock service layer or single state file, making it straightforward to attach to Supabase Realtime listeners and Postgres tables later.

- Provide clean, downloadable PDF mockups or beautifully formatted print-friendly views for prescriptions, ensuring placeholders for the doctor's KMPDC license number are easily hardcoded.

## Doctor portal authentication

The `/doctor` portal is protected by a server-validated email/password login and an encrypted, HTTP-only session cookie. In local development, use:

- **Email:** `doctor@lovableclinic.co.ke`
- **Password:** `ComradeClinic150!`

Production deliberately has no fallback credentials. Copy `.env.example` into your deployment configuration and set unique values for `SESSION_SECRET` (at least 32 characters), `DOCTOR_EMAIL`, and `DOCTOR_PASSWORD`.

This is the secure gate for the current single-doctor mock. Before handling real patient data, replace the shared environment account with individual clinician identities (for example, Supabase Auth + MFA) and enforce authorization/RLS on every database read and mutation.

See [`docs/AUTOMATION_RECOMMENDATIONS.md`](docs/AUTOMATION_RECOMMENDATIONS.md) for the recommended backend, M-Pesa, queue, clinical, notification, and CI automation roadmap.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9146b9b1-a732-4566-aadc-9bf473b263df).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
