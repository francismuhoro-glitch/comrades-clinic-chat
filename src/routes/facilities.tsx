import { createFileRoute, Link } from "@tanstack/react-router";
import { Ambulance, FlaskConical, Hospital, LifeBuoy, MapPin, Siren } from "lucide-react";

import { FacilityDirectory } from "@/components/clinic/FacilityDirectory";
import { PublicList, PublicPageLayout, PublicSection } from "@/components/clinic/PublicPageLayout";

export const Route = createFileRoute("/facilities")({
  head: () => ({
    meta: [
      { title: "Find care near campus — hospitals, labs & referrals | Comrades Clinic" },
      {
        name: "description",
        content:
          "Find a hospital, health centre or lab near your campus in Kenya: search the KMHFL facility directory, see how referral letters and doorstep lab sample collection work, and get the emergency numbers students should call first.",
      },
    ],
  }),
  component: FacilitiesPage,
});

function FacilitiesPage() {
  return (
    <PublicPageLayout
      eyebrow="Find care & referrals"
      icon={Hospital}
      title="Hospitals, labs and referrals near your campus"
      intro="A Comrades Clinic consultation does not end with advice. When you need a physical facility, the doctor issues a referral letter with directions — and you can search the Kenyan facility directory here before or after your consult."
    >
      <PublicSection title="Emergency numbers — call first, don't search" icon={Siren}>
        <PublicList
          items={[
            <>
              <strong className="font-semibold text-foreground">999</strong> (police) or{" "}
              <strong className="font-semibold text-foreground">112</strong> (emergency) for
              anything life-threatening.
            </>,
            <>
              <strong className="font-semibold text-foreground">1199</strong> Kenya Red Cross ·
              ambulance and emergency response.
            </>,
            <>
              <strong className="font-semibold text-foreground">1195</strong> mental-health line ·{" "}
              <strong className="font-semibold text-foreground">1190</strong> GBV support ·{" "}
              <strong className="font-semibold text-foreground">116</strong> Childline.
            </>,
            "In an emergency, go to the nearest Level 4, 5 or 6 facility immediately — do not wait for a chat consultation.",
          ]}
        />
      </PublicSection>

      <PublicSection title="How referrals work in the app" icon={Ambulance}>
        <PublicList
          items={[
            "During a consultation the clinician can decide you need hospital-level care and issue a referral letter in the chat.",
            "The letter names the facility and the reason for referral, with a one-tap Google Maps directions link — useful when you are new on campus or away from home.",
            "Your referral stays in your visit history, so you can show it at the facility even if you closed the chat.",
          ]}
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Referral decisions are clinical: they rest with the treating doctor, not with a search
          result or a distance filter.
        </p>
      </PublicSection>

      <PublicSection title="Lab tests: doorstep or nearby lab" icon={FlaskConical}>
        <PublicList
          items={[
            <>
              <strong className="font-semibold text-foreground">Doorstep sample collection</strong>{" "}
              — a certified phlebotomist visits your hostel, campus room or home. Available daily,
              7:00 AM to 6:00 PM, and they call 15 minutes before arriving.
            </>,
            <>
              <strong className="font-semibold text-foreground">
                Visit a nearby lab or hospital
              </strong>{" "}
              — you get a referral slip and directions to the nearest facility that can run the
              test.
            </>,
            "You can also decline the test after talking it through with the doctor in the chat. Lab charges are paid to the lab or the collection service, not through Comrades Clinic.",
          ]}
        />
      </PublicSection>

      <PublicSection title="Search the Kenya facility directory" icon={MapPin}>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Search the bundled snapshot of the Kenya Master Health Facility List (KMHFL) — 4,834
          facilities across 69 counties, including public hospitals, health centres, dispensaries,
          private hospitals and specialised clinics — and filter to emergency-ready facilities. Each
          result links straight to Google Maps directions.
        </p>
        <FacilityDirectory />
      </PublicSection>

      <PublicSection title="Students' care pathways" icon={LifeBuoy}>
        <PublicList
          items={[
            <>
              <strong className="font-semibold text-foreground">
                Non-emergency, from your room:
              </strong>{" "}
              start a consultation —{" "}
              <Link to="/how-it-works" className="font-semibold text-primary hover:underline">
                see how it works
              </Link>
              .
            </>,
            <>
              <strong className="font-semibold text-foreground">Mental health:</strong> the{" "}
              <Link to="/wellness" className="font-semibold text-primary hover:underline">
                Wellness Hub
              </Link>{" "}
              lists free 24/7 crisis lines; therapy consultations with the psychiatrist are
              available in the app.
            </>,
            <>
              <strong className="font-semibold text-foreground">
                Campus clinic or dispensary:
              </strong>{" "}
              a Comrades Clinic prescription or referral is accepted at licensed pharmacies and
              public facilities — bring the digital document on your phone.
            </>,
          ]}
        />
      </PublicSection>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Consult a doctor first
        </Link>
        <Link
          to="/faq"
          className="inline-flex h-11 items-center rounded-xl border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-primary/40"
        >
          Read the FAQ
        </Link>
      </div>

      <p className="text-center text-[10px] leading-snug text-muted-foreground">
        Facility details come from the Kenya Master Health Facility List (KMHFL) and are provided
        for convenience only. Phone numbers and opening hours change — call ahead when you can, and
        never delay emergency care to check this directory.
      </p>
    </PublicPageLayout>
  );
}
