import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  HeartHandshake,
  Lock,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import { PublicList, PublicPageLayout, PublicSection } from "@/components/clinic/PublicPageLayout";
import { CONSULT_FEE_KES, DOCTOR, THERAPY_FEE_KES } from "@/lib/clinic-types";
import { medicalOrganizationSchema, seoHead, webPageSchema } from "@/lib/seo";

const TITLE = "About — KMPDC-registered student telemedicine | Comrades Clinic";
const DESCRIPTION =
  "Who runs Comrades Clinic: KMPDC-registered clinicians led by Dr. Francis Muhoro, MBChB, non-emergency telemedicine for Kenyan students, and how your health data is protected.";

export const Route = createFileRoute("/about")({
  head: () =>
    seoHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/about",
      schema: [
        medicalOrganizationSchema(),
        webPageSchema({
          title: TITLE,
          description: DESCRIPTION,
          path: "/about",
          type: "AboutPage",
        }),
      ],
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicPageLayout
      eyebrow="About the clinic"
      icon={Stethoscope}
      title="Telemedicine built around student life in Kenya"
      intro="Comrades Clinic exists because getting to a doctor between lectures, attachment and exams is hard — and paying for one is harder. We keep both costs down: a flat M-Pesa fee, and a consultation that comes to your phone."
    >
      <PublicSection title="What we do" icon={MessageSquare}>
        <p className="text-xs leading-relaxed text-muted-foreground">
          We run a non-emergency, outpatient telemedicine service for university and college
          students. A student describes their symptoms, pays a flat fee of KSh {CONSULT_FEE_KES} for
          a general consultation (or KSh {THERAPY_FEE_KES} for a therapy consultation with the
          psychiatrist), and consults a registered clinician in an encrypted chat — with voice or
          video available when typing is not enough. Where it is clinically appropriate, the
          clinician issues a digital prescription, a lab order or a referral letter to a physical
          facility.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The service is deliberately non-emergency: severe chest pain, heavy bleeding, difficulty
          breathing, fainting, a seizure or thoughts of self-harm are screened for during intake and
          answered with "go to hospital now", not a queue position.
        </p>
      </PublicSection>

      <PublicSection title="Who treats you" icon={Stethoscope}>
        <div className="rounded-xl border bg-secondary/40 p-4">
          <p className="text-sm font-extrabold">{DOCTOR.name}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-primary">{DOCTOR.title}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            KMPDC registration No. {DOCTOR.kmpdc_license}
          </p>
        </div>
        <PublicList
          items={[
            "Every clinician on the platform is registered with the Kenya Medical Practitioners and Dentists Council (KMPDC), and clinical decisions — prescribing, lab orders, referrals — rest with the treating doctor.",
            "The psychiatrist handles therapy and mental-health consultations; the doctor portal is restricted to verified clinician accounts only.",
            "Documents you receive (prescriptions, referrals, lab orders) carry the prescriber’s details and the clinic’s registration number, so they are accepted at pharmacies and facilities.",
          ]}
        />
      </PublicSection>

      <PublicSection title="Privacy and security, concretely" icon={Lock}>
        <PublicList
          items={[
            "Chat messages are encrypted in your browser with AES-256-GCM before they are stored — the ciphertext is what leaves your device.",
            "All traffic runs over TLS, and clinical records in the database are protected by row-level security so only authorised clinicians can open a consultation.",
            "Your health data is never sold, leased or monetised. It is disclosed only to a receiving facility or partner laboratory with your knowledge, or where Kenyan law requires it.",
            <>
              The clinic works to the Kenya Data Protection Act (2019) — read the{" "}
              <Link to="/privacy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for the data-controller position and your rights as a data subject.
            </>,
          ]}
        />
      </PublicSection>

      <PublicSection title="Who it is for" icon={GraduationCap}>
        <PublicList
          items={[
            "Undergraduate and college students in Kenya — intake lists 329 universities and colleges, and you pick yours when you register.",
            "Students on attachment or far from home, who need a doctor without travelling to their usual clinic.",
            "Comrades who want mental-health support without a queue: private mood check-in, therapy consultations, and free 24/7 crisis lines.",
          ]}
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Care is delivered from wherever you are — hostel, campus or home — as long as you have a
          phone with M-Pesa and a connection. The app works offline-first, so a dropped connection
          does not lose your messages.
        </p>
      </PublicSection>

      <PublicSection title="What we do not claim" icon={ShieldCheck}>
        <PublicList
          items={[
            "We are not a hospital, an ambulance service or an emergency department.",
            "We do not replace a physical examination where one is clinically necessary — the doctor will tell you when to come in or be referred.",
            "We do not run drone deliveries, insurance schemes or claims not visible in this product; if a feature is not in the app, we do not advertise it.",
          ]}
        />
      </PublicSection>

      <PublicSection title="Reach us" icon={Users}>
        <PublicList
          items={[
            <>
              Inside the app: start a consultation or book a slot on the{" "}
              <Link to="/book" className="font-semibold text-primary hover:underline">
                booking page
              </Link>
              .
            </>,
            "By phone: the clinic helpline shown in the emergency bar at the top of every page.",
            "On WhatsApp: the site-help button in the header or footer of the app, for anything that is not a medical question.",
            <>
              For common questions — fees, prescriptions, labs, privacy — the{" "}
              <Link to="/faq" className="font-semibold text-primary hover:underline">
                FAQ
              </Link>{" "}
              answers most of them in one page.
            </>,
          ]}
        />
      </PublicSection>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <HeartHandshake className="size-4" />
          Start a consultation
        </Link>
        <Link
          to="/pricing"
          className="inline-flex h-11 items-center rounded-xl border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-primary/40"
        >
          See pricing
        </Link>
      </div>
    </PublicPageLayout>
  );
}
