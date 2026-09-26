// FAQ content lives here (not inside the route file) so the page, its metadata
// and — later — the FAQPage structured data all read from one source.
//
// Every answer is written strictly from what this repository actually does
// (fees in src/lib/clinic-types.ts, payment in MpesaProcessing, triage in
// src/lib/triage.ts, lab collection in LabOrderChoice, crisis lines in
// src/routes/wellness.tsx). Do not add claims here that the product cannot
// back up.

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "How much does a consultation cost?",
    a: "A general consultation is KSh 150. A therapy / mental-health consultation with the psychiatrist is KSh 250. The fee covers the consultation and any prescription, lab order or referral letter the clinician issues during it.",
  },
  {
    q: "How do I pay?",
    a: "By M-Pesa, to the clinic's Pochi la Biashara number shown on the payment screen right after intake. Send the exact amount, then enter your M-Pesa reference code and the phone number you paid from. A clinician verifies the payment before you join the queue.",
  },
  {
    q: "How soon will I be seen?",
    a: "The header shows whether the doctor is online right now. Once your payment is verified you join the queue and are attended in turn; if the doctor is offline you are attended when clinic hours resume.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. Intake asks for your name, M-Pesa phone number and institution. Adding an email is optional and lets the clinic send you a visit report. Signing in (with a one-time code sent to your email) is only needed for the My Visits history when you switch devices.",
  },
  {
    q: "Is my consultation private?",
    a: "Yes. Chat messages are encrypted in your browser with AES-256-GCM before they are stored, all traffic runs over TLS, and database rows are protected by row-level security so only authorised clinicians can open a consultation. Student health data is never sold — see the Privacy Policy for the full Data Protection Act 2019 position.",
  },
  {
    q: "Can I get a prescription?",
    a: "Where it is clinically appropriate, the treating clinician issues a digital prescription in the chat showing the prescriber and the clinic's KMPDC registration number. Present it at any licensed pharmacy.",
  },
  {
    q: "What if I need a lab test?",
    a: "The doctor orders the test inside the app. You then choose doorstep sample collection (a certified phlebotomist visits your hostel, campus room or home, daily 7:00 AM – 6:00 PM) or a referral slip with directions to the nearest partner lab or hospital. Lab charges are paid to the lab or collection service, not through Comrades Clinic.",
  },
  {
    q: "What if I need a hospital?",
    a: "The clinician issues a referral letter naming the facility and the reason for referral, with a Google Maps directions link. You can also browse the Kenyan facility directory on the Find Care page before or after your consultation.",
  },
  {
    q: "Can I talk to the doctor instead of typing?",
    a: "Yes. An audio-first voice call — with video if you both want it — can be started from an active consultation. Calls run on Jitsi and can open inside the app or in a separate tab.",
  },
  {
    q: "Is this service for emergencies?",
    a: "No. Comrades Clinic is non-emergency outpatient telemedicine for students. If you have severe chest pain, heavy bleeding, difficulty breathing, fainting, a seizure or thoughts of self-harm, call 999 / 112 / 1199 or go to the nearest hospital immediately instead of waiting for the chat. The intake form screens for these red flags and tells you the same thing.",
  },
  {
    q: "What happens if my internet drops mid-consultation?",
    a: "The app is offline-first: your messages are queued on your device and sent automatically when you reconnect, and recently loaded visit data stays available offline. You can also install it on your phone as an app from the browser menu.",
  },
  {
    q: "Can I book a specific time instead of joining the queue?",
    a: "Yes. The booking page shows the next seven days of 30-minute slots from 09:00 to 16:00 East Africa Time, with at least an hour's notice. The doctor confirms the request from the portal and you get a notification.",
  },
  {
    q: "What mental-health support is available?",
    a: "The Wellness Hub is free and needs no payment: a private mood check-in, practical self-care, and Kenya's 24/7 crisis lines (1199 Red Cross, 0722 178 177 Befrienders Kenya, 1190 LVCT Health, 1195 mental-health line). A therapy consultation with the psychiatrist is KSh 250.",
  },
  {
    q: "Which campuses do you cover?",
    a: "Intake lists 329 Kenyan universities and colleges across the country, and you pick yours when you register. Care is delivered from wherever you are — hostel, campus or home — as long as you have a phone with M-Pesa and an internet connection.",
  },
  {
    q: "Who sees my information?",
    a: "Only the clinicians treating you. Doctors sign in to a restricted portal, clinical records are protected by row-level security, and payments are verified against the M-Pesa reference you submit. Comrades Clinic does not sell, lease or monetise student health data.",
  },
  {
    q: "Something on the site isn't working. Who do I contact?",
    a: "Use the WhatsApp button in the header or footer to message the clinic directly, or call the helpline number shown in the emergency bar at the top of every page.",
  },
];
