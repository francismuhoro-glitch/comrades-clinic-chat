import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, Check, CreditCard, Receipt, RotateCcw, ShieldCheck, Wallet } from "lucide-react";

import { PublicList, PublicPageLayout, PublicSection } from "@/components/clinic/PublicPageLayout";
import { CONSULT_FEE_KES, THERAPY_FEE_KES } from "@/lib/clinic-types";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      {
        title: `Pricing — KSh ${CONSULT_FEE_KES} doctor chat, KSh ${THERAPY_FEE_KES} therapy | Comrades Clinic`,
      },
      {
        name: "description",
        content:
          "Comrades Clinic pricing for Kenyan students: KSh 150 general consultation, KSh 250 therapy/mental-health consultation, paid by M-Pesa Pochi la Biashara. What is included, what is not, and how refunds work.",
      },
    ],
  }),
  component: PricingPage,
});

const INCLUDED = [
  "The full consultation with a KMPDC-registered clinician — encrypted chat, plus audio-first voice or video if you ask for it.",
  "Clinical advice and a follow-up plan in the chat.",
  "A digital prescription where it is clinically appropriate, showing the prescriber and clinic registration.",
  "A lab order or a referral letter if the clinician decides one is needed, with directions to the facility.",
  "Your visit history, so you can reopen the prescription or referral later.",
];

function PricingPage() {
  return (
    <PublicPageLayout
      eyebrow="Pricing"
      icon={Wallet}
      title="One flat fee per consultation — no consultation-hour billing"
      intro="You pay once, before the consultation, in Kenyan shillings on M-Pesa. There are no hourly rates, no subscription and no card required."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl border-2 border-primary/40 bg-card p-5 shadow-card">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
            <CreditCard className="size-3" /> Most common
          </span>
          <p className="text-sm font-extrabold">General consultation</p>
          <p className="text-3xl font-extrabold text-primary">
            KSh {CONSULT_FEE_KES}
            <span className="ml-1 text-xs font-semibold text-muted-foreground">per session</span>
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Symptoms and general health: fever, cough, headache, stomach pain, urinary symptoms,
            skin problems, STI concerns, injuries and more.
          </p>
        </div>

        <div className="space-y-2 rounded-2xl border bg-card p-5 shadow-card">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
            <ShieldCheck className="size-3" /> Mental health
          </span>
          <p className="text-sm font-extrabold">Therapy consultation</p>
          <p className="text-3xl font-extrabold text-primary">
            KSh {THERAPY_FEE_KES}
            <span className="ml-1 text-xs font-semibold text-muted-foreground">per session</span>
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Stress, anxiety and low mood, with the psychiatrist. Free crisis lines are listed on the{" "}
            <Link to="/wellness" className="font-semibold text-primary hover:underline">
              Wellness Hub
            </Link>{" "}
            whether or not you pay.
          </p>
        </div>
      </div>

      <PublicSection title="What the fee includes" icon={Check}>
        <PublicList items={INCLUDED} />
      </PublicSection>

      <PublicSection title="How payment works" icon={Receipt}>
        <PublicList
          items={[
            <>
              Pay to the clinic's{" "}
              <strong className="font-semibold text-foreground">Pochi la Biashara</strong> number
              shown on the payment screen after intake. Send exactly the fee for the service you
              chose.
            </>,
            <>
              Enter your{" "}
              <strong className="font-semibold text-foreground">M-Pesa reference code</strong> and
              the phone number you paid from.
            </>,
            "A clinician verifies the payment against the clinic's M-Pesa statement, then your consultation enters the queue. Unverified codes are rejected rather than silently queued.",
          ]}
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Payment is by M-Pesa only. Comrades Clinic never asks for your M-Pesa PIN, and no card
          details are collected anywhere in the app.
        </p>
      </PublicSection>

      <PublicSection title="What is not included" icon={Ban}>
        <PublicList
          items={[
            "Lab test and sample-collection charges — these are paid to the partner lab or the doorstep phlebotomist, not to Comrades Clinic.",
            "Medication costs at the pharmacy, and any hospital charges after a referral.",
            "Ambulance or emergency transport: the app is non-emergency and will always direct you to call 999 / 112 / 1199 first.",
          ]}
        />
      </PublicSection>

      <PublicSection title="Refunds and credits" icon={RotateCcw}>
        <p className="text-xs leading-relaxed text-muted-foreground">
          If your payment is verified but you do not receive a consultation because of clinic
          downtime or a technical fault, you are entitled to a full consultation credit or refund.
          Contact the clinic helpline shown in the emergency bar at the top of every page and it is
          resolved directly with you.
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Fees, refunds and escalation are governed by the{" "}
          <Link to="/terms" className="font-semibold text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and the{" "}
          <Link to="/privacy" className="font-semibold text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </PublicSection>

      <PublicSection title="Referral programme" icon={ShieldCheck}>
        <p className="text-xs leading-relaxed text-muted-foreground">
          A student referral programme — invite codes, KSh 50 off a friend's first consultation and
          KSh 30 credit for you — is built into the database but not switched on yet. Pricing above
          is the standard, current pricing.
        </p>
      </PublicSection>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Start a KSh {CONSULT_FEE_KES} consultation
        </Link>
        <Link
          to="/how-it-works"
          className="inline-flex h-11 items-center rounded-xl border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-primary/40"
        >
          See how it works
        </Link>
      </div>
    </PublicPageLayout>
  );
}
