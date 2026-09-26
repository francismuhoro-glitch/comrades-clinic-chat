// Per-route SEO metadata: canonical URL, Open Graph / Twitter tags, robots
// directives and JSON-LD structured data.
//
// Design rules:
//  - Everything here is derived from what the product actually does. Fees come
//    from src/lib/clinic-types.ts, the clinician from DOCTOR, and no statistic,
//    certification, address or phone number is invented. Phone numbers are
//    deliberately NOT published in structured data because they live in the
//    `clinic_settings` row and can change without a deploy.
//  - Public routes call seoHead(); auth-gated routes (/doctor, /admin, /visits,
//    /referrals) are noindex.
//  - TanStack Router dedupes meta entries by `name`/`property`, deepest route
//    first, so a route's og:* values override the root defaults.

import type { JSX } from "react";

import { CONSULT_FEE_KES, DOCTOR, THERAPY_FEE_KES } from "./clinic-types";
import { SITE_BRAND, SITE_NAME, SITE_ORIGIN, absoluteUrl } from "./site";

/** Square app icon — the only brand image shipped in /public today. */
const OG_IMAGE_PATH = "/icons/icon-512.png";

const ORG_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

export interface SeoHead {
  meta: JSX.IntrinsicElements["meta"][];
  links: JSX.IntrinsicElements["link"][];
}

export interface SeoHeadOptions {
  title: string;
  description: string;
  /** Route path, e.g. "/pricing" — used for the canonical and og:url. */
  path: string;
  /** og:type. Defaults to "website". */
  type?: "website" | "article";
  /** When true, adds `robots: noindex, nofollow` and no canonical. */
  noindex?: boolean;
  /** JSON-LD nodes for this page (wrapped into a single @graph). */
  schema?: Record<string, unknown>[];
}

/**
 * Build the head config for a route: title, description, canonical, Open Graph,
 * Twitter card, robots and JSON-LD.
 */
export function seoHead({
  title,
  description,
  path,
  type = "website",
  noindex = false,
  schema = [],
}: SeoHeadOptions): SeoHead {
  const url = absoluteUrl(path);
  const image = absoluteUrl(OG_IMAGE_PATH);

  const meta: JSX.IntrinsicElements["meta"][] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_KE" },
    { property: "og:image", content: image },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "512" },
    { property: "og:image:height", content: "512" },
    { property: "og:image:alt", content: `${SITE_BRAND} — student telemedicine in Kenya` },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];

  if (noindex) meta.push({ name: "robots", content: "noindex, nofollow" });
  if (schema.length > 0) {
    // TanStack Router renders a `{ "script:ld+json": … }` meta entry as an
    // inline <script type="application/ld+json"> (HTML-escaped). React's meta
    // attribute types have no such key, hence the cast.
    meta.push({
      "script:ld+json": jsonLdGraph(schema),
    } as unknown as JSX.IntrinsicElements["meta"]);
  }

  const links: JSX.IntrinsicElements["link"][] = noindex ? [] : [{ rel: "canonical", href: url }];

  return { meta, links };
}

/** Wrap nodes into one `@graph` document so a page emits a single JSON-LD block. */
export function jsonLdGraph(nodes: Record<string, unknown>[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

/**
 * The clinic itself. Used on the homepage and the About page.
 * Claims: non-emergency student telemedicine in Kenya, M-Pesa payment, the two
 * published fees, KMPDC-registered clinicians, and the services the app
 * actually offers.
 */
export function medicalOrganizationSchema(): Record<string, unknown> {
  return {
    "@type": "MedicalOrganization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: SITE_BRAND,
    url: `${SITE_ORIGIN}/`,
    logo: absoluteUrl(OG_IMAGE_PATH),
    image: absoluteUrl(OG_IMAGE_PATH),
    description:
      "Non-emergency telemedicine for Kenyan university and college students: pay a flat M-Pesa fee and consult a KMPDC-registered clinician by encrypted chat, voice or video, with digital prescriptions, lab orders and hospital referrals.",
    areaServed: { "@type": "Country", name: "Kenya" },
    audience: { "@type": "EducationalAudience", educationalRole: "student" },
    availableLanguage: ["en"],
    medicalSpecialty: ["https://schema.org/PrimaryCare", "https://schema.org/Psychiatric"],
    availableService: [
      {
        "@type": "MedicalProcedure",
        name: "Online doctor consultation over encrypted chat",
      },
      {
        "@type": "MedicalProcedure",
        name: "Voice and video consultation (audio-first)",
      },
      {
        "@type": "MedicalTherapy",
        name: "Therapy / mental-health consultation with a psychiatrist",
      },
      {
        "@type": "MedicalTest",
        name: "Lab test ordering with doorstep or partner-lab sample collection",
      },
    ],
    employee: {
      "@type": "Physician",
      name: DOCTOR.name,
      jobTitle: DOCTOR.title,
      identifier: {
        "@type": "PropertyValue",
        propertyID: "KMPDC registration",
        value: DOCTOR.kmpdc_license,
      },
    },
    hasOfferCatalog: offerCatalogSchema(),
  };
}

/** The two consultations the app sells, at the prices defined in code. */
export function offerCatalogSchema(): Record<string, unknown> {
  return {
    "@type": "OfferCatalog",
    name: "Student telemedicine consultations",
    itemListElement: [
      {
        "@type": "Offer",
        priceCurrency: "KES",
        price: String(CONSULT_FEE_KES),
        itemOffered: { "@type": "Service", name: "General doctor consultation" },
      },
      {
        "@type": "Offer",
        priceCurrency: "KES",
        price: String(THERAPY_FEE_KES),
        itemOffered: { "@type": "Service", name: "Therapy consultation with a psychiatrist" },
      },
    ],
  };
}

export function webSiteSchema(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_ORIGIN}/`,
    name: SITE_NAME,
    alternativeName: SITE_BRAND,
    inLanguage: "en-KE",
    publisher: { "@id": ORG_ID },
  };
}

/** For service pages: how it works, pricing, booking, find-care, wellness hub. */
export function medicalWebPageSchema(input: {
  title: string;
  description: string;
  path: string;
}): Record<string, unknown> {
  const url = absoluteUrl(input.path);
  return {
    "@type": "MedicalWebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.title,
    description: input.description,
    inLanguage: "en-KE",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    audience: { "@type": "EducationalAudience", educationalRole: "student" },
  };
}

/** For informational pages (About, legal pages). */
export function webPageSchema(input: {
  title: string;
  description: string;
  path: string;
  type?: "WebPage" | "AboutPage";
}): Record<string, unknown> {
  const url = absoluteUrl(input.path);
  return {
    "@type": input.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.title,
    description: input.description,
    inLanguage: "en-KE",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    ...(input.type === "AboutPage" ? { about: { "@id": ORG_ID } } : {}),
  };
}

/** FAQPage built from the same items the /faq page renders. */
export function faqPageSchema(input: {
  title: string;
  description: string;
  path: string;
  items: { q: string; a: string }[];
}): Record<string, unknown> {
  const url = absoluteUrl(input.path);
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    name: input.title,
    description: input.description,
    inLanguage: "en-KE",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    mainEntity: input.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
