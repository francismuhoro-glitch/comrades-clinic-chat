import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, FileText, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Comrades Clinic" },
      {
        name: "description",
        content: "Terms of Service and Telemedicine User Agreement for Comrades Clinic.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
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

        <div className="space-y-2 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="size-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Legal & Compliance</span>
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">Terms of Service & Patient Agreement</h1>
          <p className="text-xs text-muted-foreground">
            Last updated: August 2026 · Compliant with Kenyan Healthcare Standards
          </p>
        </div>

        {/* Emergency Alert Banner */}
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs leading-relaxed text-destructive">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <ShieldAlert className="size-4" />
            Emergency Care Disclaimer
          </div>
          <p className="mt-1">
            Comrades Clinic is an outpatient telemedicine triage service for non-emergency student
            care. If you are experiencing severe chest pain, heavy bleeding, difficulty breathing,
            or trauma, you must immediately visit the nearest physical hospital or Level 4/5/6
            facility.
          </p>
        </div>

        <section className="space-y-4 text-xs leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              1. Telemedicine Scope & Consultations
            </h2>
            <p className="mt-1">
              Comrades Clinic connects Kenyan university and college students with registered,
              licensed medical practitioners. Digital consultations are conducted via encrypted
              real-time chat. The clinician evaluates your reported symptoms, provides clinical
              advice, and may issue digital prescriptions, lab orders, or referral letters where
              clinically appropriate.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              2. Clinician Authority & KMPDC Compliance
            </h2>
            <p className="mt-1">
              All healthcare providers operating on Comrades Clinic are verified medical
              practitioners registered with the Kenya Medical Practitioners and Dentists Council
              (KMPDC). Clinical decisions, including prescribing and referrals, remain strictly
              under the professional judgment of the treating doctor.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              3. Consultation Fees & Pochi la Biashara Payments
            </h2>
            <p className="mt-1">
              The standard consultation fee is <strong>KSh 150</strong> per session, payable via
              Safaricom M-Pesa / Pochi la Biashara. You must provide an accurate 10-character M-Pesa
              transaction reference code. Consultations are queued upon clinician verification of
              the payment.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">4. Refund & Escalation Policy</h2>
            <p className="mt-1">
              If your payment is verified but you do not receive a consultation due to clinic
              downtime or technical issues, you are entitled to a full consultation credit or
              refund. Contact the clinic helpline for prompt resolution.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              5. Patient Accuracy & Medical Records
            </h2>
            <p className="mt-1">
              You agree to provide accurate, honest, and complete information regarding your
              symptoms, medical history, known allergies, and current medications. Falsifying
              medical intake data can lead to incorrect clinical assessments.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">6. Governing Law</h2>
            <p className="mt-1">
              These terms are governed by and construed in accordance with the Laws of the Republic
              of Kenya, including the Health Act (2017) and the Kenya Information and Communications
              Act.
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
