import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, MessageCircleQuestion, Phone } from "lucide-react";

import { PublicPageLayout, PublicSection } from "@/components/clinic/PublicPageLayout";
import { FAQ_ITEMS } from "@/lib/faq-content";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — fees, privacy, prescriptions & labs | Comrades Clinic" },
      {
        name: "description",
        content:
          "Answers for Kenyan students using Comrades Clinic: how much a consultation costs, how M-Pesa payment works, whether the chat is private, how prescriptions, lab tests and referrals work, and what to do in an emergency.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <PublicPageLayout
      eyebrow="Frequently asked questions"
      icon={MessageCircleQuestion}
      title="Everything students ask before their first consultation"
      intro="Fees, payment, privacy, prescriptions, labs, referrals and emergencies — answered in plain language. If your question is not here, the WhatsApp button below reaches the clinic team."
    >
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <section key={item.q} className="space-y-1.5 rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="flex items-start gap-2 text-sm font-extrabold">
              <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
              {item.q}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.a}</p>
          </section>
        ))}
      </div>

      <PublicSection title="Still stuck? Talk to a human" icon={Phone}>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Medical questions:{" "}
          <Link to="/" className="font-semibold text-primary hover:underline">
            start a consultation
          </Link>{" "}
          and ask the doctor directly, or call the clinic helpline in the emergency bar at the top
          of this page. Site problems: use the WhatsApp button in the footer and the clinic team
          will help you keep going.
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          In an emergency, do not use this page or the chat: call 999, 112 or 1199, or go to the
          nearest hospital.
        </p>
      </PublicSection>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Start a consultation
        </Link>
        <Link
          to="/facilities"
          className="inline-flex h-11 items-center rounded-xl border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-primary/40"
        >
          Find care near campus
        </Link>
      </div>
    </PublicPageLayout>
  );
}
