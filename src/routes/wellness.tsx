import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpenCheck,
  Brain,
  HeartHandshake,
  LifeBuoy,
  MoonStar,
  Users,
  Phone,
  Salad,
  Smartphone,
  Stethoscope,
} from "lucide-react";

import { StudentLayout } from "@/components/clinic/StudentLayout";
import { primeIntakeSymptoms } from "@/lib/wellness";

export const Route = createFileRoute("/wellness")({
  head: () => ({
    meta: [
      { title: "Wellness Hub — COMRACARE Student Clinic" },
      {
        name: "description",
        content:
          "Free mental wellness resources for Kenyan university students: 24/7 crisis lines, campus self-care, and when to talk to a doctor.",
      },
    ],
  }),
  component: WellnessHub,
});

const CRISIS_LINES = [
  {
    label: "1199",
    detail: "Kenya Red Cross — free counselling, toll-free, 24/7",
    href: "tel:1199",
  },
  {
    label: "0722 178 177",
    detail: "Befrienders Kenya — someone to listen, 24/7",
    href: "tel:+254722178177",
  },
  {
    label: "1190",
    detail: "LVCT Health — youth health & mental support line",
    href: "tel:1190",
  },
  {
    label: "999 / 112",
    detail: "Emergency — if someone is in immediate danger",
    href: "tel:999",
  },
] as const;

const SELF_CARE = [
  {
    icon: MoonStar,
    title: "Guard your sleep",
    text: "7–9 hours beats all-night cramming. Sleep is when your brain files what you studied — pull an all-nighter and you keep less, not more.",
  },
  {
    icon: Users,
    title: "Don't go quiet",
    text: "Isolation feeds low mood. One text to a friend counts. Eating with people is the cheapest therapy on campus.",
  },
  {
    icon: Smartphone,
    title: "Watch the 2 a.m. scroll",
    text: "Comparing your behind-the-scenes to everyone's highlights is a rigged game. Try charging your phone away from the bed for a week.",
  },
  {
    icon: BookOpenCheck,
    title: "Study in sprints",
    text: "50 minutes on, 10 off. Break big tasks into Ridiculously Small First Steps — open the book, read one page. Momentum does the rest.",
  },
  {
    icon: Salad,
    title: "Feed the machine",
    text: "Eggs, beans, fruit, water. Your brain runs on what you put in — constant energy drinks and skipped meals feel like anxiety from the inside.",
  },
  {
    icon: Brain,
    title: "Let it out",
    text: "Journaling, prayer, music, a walk around the field — anything that gets the thoughts out of the loop in your head.",
  },
] as const;

const SEE_A_DOCTOR_IF = [
  "Low mood or loss of interest lasting 2+ weeks",
  "Panic attacks, or worry you can't switch off",
  "Sleep that's broken most nights for weeks",
  "Using alcohol or substances to cope",
  "Thoughts of harming yourself — please, today",
] as const;

function WellnessHub() {
  const navigate = useNavigate();

  const startMentalConsult = () => {
    primeIntakeSymptoms(["mental"]);
    void navigate({ to: "/" });
  };

  return (
    <StudentLayout subtitle="Free, private mental wellness resources for comrades">
      <div className="space-y-5">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-success p-6 text-primary-foreground shadow-card">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
          <div className="relative space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm">
              <Brain className="size-3.5" /> Wellness Hub
            </span>
            <h1 className="text-2xl font-extrabold leading-tight">
              Your mind matters as much as your grades.
            </h1>
            <p className="max-w-md text-xs leading-relaxed text-primary-foreground/85">
              Nearly 1 in 3 comrades on Kenyan campuses struggles with their mental health. It's
              common, it's not a weakness, and it's treatable. Start here — no shame, no queues.
            </p>
          </div>
        </div>

        {/* Crisis lines — deliberately first */}
        <section className="space-y-3 rounded-2xl border border-warning/40 bg-warning/10 p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-warning-foreground">
            <LifeBuoy className="size-4" />
            Need someone right now? These are free &amp; 24/7.
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {CRISIS_LINES.map((line) => (
              <li key={line.label}>
                <a
                  href={line.href}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold leading-none">{line.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                      {line.detail}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-[10px] leading-snug text-muted-foreground">
            If you might act on thoughts of harming yourself, reach out now — a friend, a helpline,
            or the nearest hospital. You matter more than any exam.
          </p>
        </section>

        {/* Self-care grid */}
        <section className="space-y-2">
          <h2 className="text-sm font-extrabold">Small things that actually help</h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {SELF_CARE.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="space-y-1.5 rounded-2xl border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <p className="text-xs font-extrabold leading-tight">{title}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* When to see a doctor + CTA */}
        <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <Stethoscope className="size-4 text-primary" />
            When to talk to a doctor
          </h2>
          <ul className="space-y-1.5">
            {SEE_A_DOCTOR_IF.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-primary/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold">
              <HeartHandshake className="size-4 text-primary" />A consult is KSh 150 — encrypted
              chat or voice/video, from your hostel.
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              You choose what to share. Nothing appears on your academic records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startMentalConsult}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <HeartHandshake className="size-4" />
              Start a private consult
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" /> Back to clinic
            </Link>
          </div>
        </section>

        <p className="text-center text-[10px] leading-snug text-muted-foreground">
          The Wellness Hub is general health information, not medical advice or a diagnosis. In an
          emergency, call 999 / 112 or go to the nearest hospital.
        </p>
      </div>
    </StudentLayout>
  );
}
