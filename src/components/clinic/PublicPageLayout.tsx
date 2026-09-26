import { Link } from "@tanstack/react-router";
import { ArrowRight, Stethoscope, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmergencyContactsBar } from "@/components/clinic/EmergencyContacts";
import { WhatsAppFallback } from "@/components/clinic/WhatsAppFallback";
import { CONSULT_FEE_KES } from "@/lib/clinic-types";
import { PUBLIC_NAV } from "@/lib/site";

/**
 * Shared chrome for the PUBLIC (indexable) pages: /how-it-works, /pricing,
 * /facilities, /faq, /about.
 *
 * Everything here renders on the server with no data fetching, so a crawler
 * that never runs JavaScript still gets the headings, navigation and copy.
 * The app shell (patient chat, doctor portal, My Visits) is intentionally NOT
 * built on this layout — it uses StudentLayout / the portal chrome.
 *
 * Headings: the logo is a normal text node and each page passes its own `title`,
 * so every public page has exactly one <h1>.
 */
export function PublicPageLayout({
  eyebrow,
  title,
  intro,
  icon: HeroIcon,
  children,
}: {
  eyebrow: string;
  title: string;
  /** One- or two-sentence summary shown inside the hero. */
  intro: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <EmergencyContactsBar variant="banner" />
      <div>
        <header className="sticky top-0 z-20 border-b bg-card/95 px-4 pt-2.5 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Stethoscope className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-bold leading-none">Comrades Clinic</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  Student Telemedicine Kenya
                </span>
              </span>
            </Link>

            <Link
              to="/"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Start a consult
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <nav
            aria-label="Clinic information"
            className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 overflow-x-auto py-2 text-[11px] font-semibold text-muted-foreground"
          >
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="whitespace-nowrap transition-colors hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/book"
              className="whitespace-nowrap transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              Book a slot
            </Link>
          </nav>
        </header>

        <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-success p-6 text-primary-foreground shadow-card">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
            <div className="relative space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm">
                {HeroIcon ? <HeroIcon className="size-3.5" /> : null}
                {eyebrow}
              </span>
              <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
              <p className="max-w-xl text-xs leading-relaxed text-primary-foreground/90">{intro}</p>
              <p className="text-[11px] font-semibold text-primary-foreground/90">
                Non-emergency student care · From KSh {CONSULT_FEE_KES} per consultation
              </p>
            </div>
          </section>

          {children}
        </main>
      </div>

      <footer className="border-t bg-card/60 px-4 py-4 text-center text-[11px] text-muted-foreground">
        <div className="mx-auto max-w-3xl space-y-3">
          <EmergencyContactsBar variant="footer" />
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            {PUBLIC_NAV.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/wellness"
              className="underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Wellness Hub
            </a>
            <a
              href="/book"
              className="underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Book
            </a>
            <span>·</span>
            <a
              href="/terms"
              className="underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Terms &amp; Disclaimer
            </a>
            <a
              href="/privacy"
              className="underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Privacy Policy (ODPC)
            </a>
            <Link
              to="/doctor"
              className="underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Clinician Portal
            </Link>
          </div>
          <div className="flex justify-center">
            <WhatsAppFallback />
          </div>
          <p>
            Comrades Clinic provides non-emergency telemedicine for Kenyan university and college
            students. In an emergency, call 999 / 112 / 1199 or go to the nearest hospital.
          </p>
          <p>© 2026 Comrades Clinic Kenya · Verified Non-Emergency Student Care</p>
        </div>
      </footer>
    </div>
  );
}

/** Card-style section used across the public pages. */
export function PublicSection({
  title,
  icon: Icon,
  children,
  id,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="space-y-3 rounded-2xl border bg-card p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-sm font-extrabold">
        {Icon ? <Icon className="size-4 text-primary" /> : null}
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Bulleted list with the clinic's primary-dot styling. */
export function PublicList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}
