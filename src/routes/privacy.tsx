import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmergencyContactsBar } from "@/components/clinic/EmergencyContacts";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Comrades Clinic" },
      {
        name: "description",
        content:
          "Patient data protection and privacy policy under the Kenya Data Protection Act 2019.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <EmergencyContactsBar variant="banner" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <a href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="size-4" />
            Back to Clinic
          </Button>
        </a>

        <EmergencyContactsBar variant="card" />

        <div className="space-y-2 border-b pb-4">
          <div className="flex items-center gap-2 text-success">
            <ShieldCheck className="size-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Data Protection</span>
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Privacy & Patient Health Information Policy
          </h1>
          <p className="text-xs text-muted-foreground">
            Compliant with the Kenya Data Protection Act, 2019 (ODPC Guidelines)
          </p>
        </div>

        <section className="space-y-4 text-xs leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              1. Data Controller & Commitment
            </h2>
            <p className="mt-1">
              Comrades Clinic is dedicated to safeguarding student medical privacy. We handle
              personal health data strictly in accordance with Section 44 of the Kenya Data
              Protection Act (2019) regarding sensitive personal health data.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">2. Information We Collect</h2>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>
                <strong>Student Profile:</strong> Full name, phone number, university/college, and
                campus location.
              </li>
              <li>
                <strong>Clinical Information:</strong> Reported symptoms, duration, triage
                classification, clinical diagnosis notes, prescriptions, and lab orders.
              </li>
              <li>
                <strong>Transaction Data:</strong> M-Pesa transaction reference code, paying phone
                number, and receipt timestamps.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              3. How We Use Your Health Data
            </h2>
            <p className="mt-1">Your health data is used exclusively to:</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>
                Facilitate real-time clinical assessment and diagnosis with your treating clinician.
              </li>
              <li>Generate verifiable digital prescriptions, lab orders, and referral letters.</li>
              <li>Calculate proximity to the nearest verified emergency health facilities.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              4. Security & Encryption Standards
            </h2>
            <p className="mt-1">
              All communications are transmitted over encrypted TLS connections. Database records
              are protected by database Row Level Security (RLS), ensuring that only authorized
              clinicians can view clinical workspaces and consultations.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              5. Disclosure to Third Parties
            </h2>
            <p className="mt-1">
              We <strong>never sell, lease, or monetize</strong> student health data. Medical
              information is disclosed only to receiving referral hospitals or partner laboratories
              with your explicit knowledge, or as mandated by Kenyan law.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              6. Your Rights Under Kenyan Law
            </h2>
            <p className="mt-1">
              As a data subject, you have the right to request access to your consultation records,
              request correction of inaccurate data, and lodge inquiries with the Office of the Data
              Protection Commissioner (ODPC) of Kenya.
            </p>
          </div>
        </section>

        <div className="border-t pt-4 text-center">
          <a href="/">
            <Button className="rounded-xl px-6">Return to Consultation</Button>
          </a>
        </div>
      </div>
    </main>
  );
}
