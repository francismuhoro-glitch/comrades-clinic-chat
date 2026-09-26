// Single source of truth for the public (crawlable) surface of the site.
//
// Used by the public page layout (navigation), and by the SEO metadata
// (canonical / Open Graph / JSON-LD) and robots.txt + sitemap work.
//
// The canonical origin is inlined at BUILD time. To point the app at the final
// domain, either edit FALLBACK_ORIGIN below or set VITE_SITE_URL in Vercel and
// redeploy.

const FALLBACK_ORIGIN = "https://comrades-clinic-chat-six.vercel.app";

/** Canonical production origin, no trailing slash. */
export const SITE_ORIGIN: string = (
  import.meta.env["VITE_SITE_URL"]?.trim() || FALLBACK_ORIGIN
).replace(/\/+$/, "");

export const SITE_NAME = "COMRACARE Student Clinic";
export const SITE_BRAND = "Comrades Clinic";

/** Turn a route path into an absolute URL on the canonical origin. */
export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface PublicRoute {
  path: string;
  /** Short human label, also used as the sitemap-independent nav label. */
  label: string;
  /** Sitemap priority hint. */
  priority: number;
  changefreq: "weekly" | "monthly";
}

/**
 * Every route that should be crawled and indexed, in navigation order.
 * Keep this list in sync with src/routes/* — private routes are listed in
 * PRIVATE_ROUTE_PREFIXES instead.
 */
export const PUBLIC_ROUTES: PublicRoute[] = [
  { path: "/", label: "Student clinic home", priority: 1.0, changefreq: "weekly" },
  { path: "/how-it-works", label: "How it works", priority: 0.9, changefreq: "monthly" },
  { path: "/pricing", label: "Pricing", priority: 0.9, changefreq: "monthly" },
  { path: "/facilities", label: "Find care near you", priority: 0.8, changefreq: "monthly" },
  { path: "/faq", label: "FAQ", priority: 0.8, changefreq: "monthly" },
  { path: "/about", label: "About the clinic", priority: 0.7, changefreq: "monthly" },
  { path: "/wellness", label: "Wellness Hub", priority: 0.8, changefreq: "monthly" },
  { path: "/book", label: "Book an appointment", priority: 0.7, changefreq: "monthly" },
  { path: "/terms", label: "Terms of Service", priority: 0.3, changefreq: "monthly" },
  { path: "/privacy", label: "Privacy Policy", priority: 0.3, changefreq: "monthly" },
];

/**
 * Header navigation for the public pages (a subset of PUBLIC_ROUTES).
 * Declared `as const` so the literal paths stay assignable to TanStack Router's
 * typed `to` prop.
 */
export const PUBLIC_NAV = [
  { path: "/how-it-works", label: "How it works" },
  { path: "/pricing", label: "Pricing" },
  { path: "/facilities", label: "Find care" },
  { path: "/faq", label: "FAQ" },
  { path: "/about", label: "About" },
] as const;

/**
 * Routes that must never be indexed: auth-gated app surfaces and patient data.
 * Mirrored in public/robots.txt and by a `noindex` robots meta on each route.
 */
export const PRIVATE_ROUTE_PREFIXES = ["/doctor", "/admin", "/visits"] as const;
