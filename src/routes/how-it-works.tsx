import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  CalendarClock,
  FileText,
  FlaskConical,
  MessageSquare,
  ShieldCheck,
  Video,
  Wallet,
} from "lucide-react";

import { PublicList, PublicPageLayout, PublicSection } from "@/components/clinic/PublicPageLayout";
import { CONSULT_FEE_KES, DOCTOR, THERAPY_FEE_KES } from "@/lib/clinic-types";
import { SYMPTOM_OPTIONS } from "@/lib/triage";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — see a Kenyan doctor online from campus | Comrades Clinic" },
      {
        name: "description",
        content:
          "How a Comrades Clinic consultation works for Kenyan students: pick general or therapy, pay KSh 150 or 250 on M-Pesa, chat with a KMPDC-registered doctor, then get a prescription, lab order or referral letter on your phone.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    title: "1. Describe what's wrong",
    body: "Intake takes about a minute on a phone: your name, M-Pesa number and institution, then a checklist of common symptoms — fever, cough, headache, stomach pain, painful urination, rash, fatigue, STI concerns, stress or low mood, injury and more. Some answers trigger short follow-up questions about duration and red flags.",
  },
  {
    title: "2. Choose general or therapy",
    body: `A general consultation is KSh ${CONSULT_FEE_KES}. A therapy / mental-health consultation with the psychiatrist is KSh ${THERAPY_FEE_KES}. Both include the consultation and any document the clinician issues during it.`,
  },
  {
    title: "3. Pay on M-Pesa",
    body: "You send the fee to the clinic's Pochi la Biashara number, then enter the M-Pesa reference code and the phone number you paid from. A clinician verifies the payment before your consultation joins the queue — that is what stops random codes entering the queue.",
  },
  {
    title: "4. Talk to the clinician",
    body: "Once verified you are in the queue and see whether the doctor is online. Consultation happens in an encrypted chat; you can ask for an audio-first voice call, with video if you both want it. Your messages are encrypted in your browser before they are stored.",
  },
  {
    title: "5. Get your documents",
    body: "Depending on what the clinician finds: a digital prescription you can present at any pharmacy, a lab order, a referral letter naming the facility with directions, or advice and a follow-up plan. Everything stays in your visit history.",
  },
];

function HowItWorksPage() {
  return (
    <PublicPageLayout
      eyebrow="How it works"
      icon={Activity}
      title="See a Kenyan doctor online, from your hostel"
      intro="Comrades Clinic is a non-emergency telemedicine service for Kenyan university and college students. No queue at the clinic, no transport fare — describe your symptoms, pay with M-Pesa, and consult a registered doctor in an encrypted chat."
    >
      <PublicSection title="The five steps" icon={Wallet}>
        <ol className="space-y-4">
          {STEPS.map((step) => (
            <li key={step.title} className="space-y-1">
              <p className="text-xs font-extrabold text-foreground">{step.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </PublicSection>

      <PublicSection title="What you can get out of a consultation" icon={FileText}>
        <PublicList
          items={[
            <>
              <strong className="font-semibold text-foreground">Encrypted text chat</strong> with
              the doctor — real-time, and it keeps working if your connection drops.
            </>,
            <>
              <strong className="font-semibold text-foreground">Voice and video calls</strong> when
              typing is not enough. Audio first; video only if you both agree.
            </>,
            <>
              <strong className="font-semibold text-foreground">Digital prescriptions</strong>{" "}
              issued where clinically appropriate, showing the prescriber and KMPDC registration.
            </>,
            <>
              <strong className="font-semibold text-foreground">Lab orders</strong> with a choice of
              doorstep sample collection (a certified phlebotomist, daily 7:00 AM – 6:00 PM) or a
              partner lab or hospital near you.
            </>,
            <>
              <strong className="font-semibold text-foreground">Referral letters</strong> naming the
              facility and the reason, with a Google Maps directions link.
            </>,
            <>
              <strong className="font-semibold text-foreground">A visit history</strong> you can
              reopen on any device by signing in with a one-time code sent to your email.
            </>,
          ]}
        />
      </PublicSection>

      <PublicSection title="Before you start" icon={ShieldCheck}>
        <PublicList
          items={[
            <>
              You need a phone with M-Pesa and an internet connection. Adding an email is optional —
              it only enables visit reports and cross-device history.
            </>,
            <>
              Every consultation is reviewed by a clinician registered with the Kenya Medical
              Practitioners and Dentists Council (KMPDC). The telemedicine lead is {DOCTOR.name},{" "}
              {DOCTOR.title} (KMPDC No. {DOCTOR.kmpdc_license}).
            </>,
            <>
              The symptom checklist covers {SYMPTOM_OPTIONS.length} common presentations and screens
              for red flags. If your answers suggest an emergency, the app stops and tells you to go
              to hospital rather than waiting for the chat.
            </>,
            <>
              Prefer a fixed time? Use{" "}
              <Link to="/book" className="font-semibold text-primary hover:underline">
                booking
              </Link>{" "}
              for the next seven days of 30-minute slots, 09:00–16:00 East Africa Time.
            </>,
          ]}
        />
        <div className="rounded-xl bg-primary/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
          Comrades Clinic is not an emergency service and does not replace a physical examination
          when one is needed. In an emergency call 999 / 112 / 1199 or go to the nearest hospital.
        </div>
      </PublicSection>

      <PublicSection title="Costs, in one line" icon={Wallet}>
        <p className="text-xs leading-relaxed text-muted-foreground">
          General consultation KSh {CONSULT_FEE_KES} · Therapy / mental-health consultation KSh{" "}
          {THERAPY_FEE_KES}. Paid by M-Pesa before the consultation.{" "}
          <Link to="/pricing" className="font-semibold text-primary hover:underline">
            See the full pricing page
          </Link>
          .
        </p>
      </PublicSection>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <MessageSquare className="size-4" />
          Start a consultation
        </Link>
        <Link
          to="/book"
          className="inline-flex h-11 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-primary/40"
        >
          <CalendarClock className="size-4 text-primary" />
          Book a slot instead
        </Link>
      </div>

      <PublicSection title="Built for campus connectivity" icon={Video}>
        <PublicList
          items={[
            "The app installs on your phone like a native app and keeps recently loaded visit data available offline.",
            "If you lose connection mid-chat, your messages queue on your device and send automatically when you are back online.",
            "Nothing in the consultation flow needs JavaScript-only third-party chat widgets — calls are opt-in and load only when you start one.",
          ]}
        />
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <FlaskConical className="size-3.5 text-primary" />
          Lab collection hours and partner labs depend on your location; the options are shown in
          the app when the doctor orders a test.
        </p>
      </PublicSection>
    </PublicPageLayout>
  );
}
