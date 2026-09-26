// XML sitemap for the PUBLIC routes only.
//
// Served from the app's server entry (src/server.ts) at /sitemap.xml rather
// than written as a build artefact: PUBLIC_ROUTES in src/lib/site.ts is the
// single source of truth, so the sitemap can never drift from the routes that
// actually exist, and no generated file needs to be committed or gitignored.
//
// Private routes (/doctor, /admin, /visits, /referrals) are deliberately absent
// and are disallowed in public/robots.txt.

import { PUBLIC_ROUTES, absoluteUrl } from "./site";

export const SITEMAP_PATH = "/sitemap.xml";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build the sitemap document. `lastmod` is intentionally omitted: nothing in
 * the app tracks per-page modification times, and an inaccurate lastmod is
 * worse than none.
 */
export function buildSitemapXml(): string {
  const urls = PUBLIC_ROUTES.map((route) =>
    [
      "  <url>",
      `    <loc>${escapeXml(absoluteUrl(route.path))}</loc>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority.toFixed(1)}</priority>`,
      "  </url>",
    ].join("\n"),
  ).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

/**
 * XML response for /sitemap.xml, or null when the request is for anything else.
 * Shared by the production server entry and the dev server, so the URL behaves
 * identically in both.
 */
export function sitemapResponse(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  let pathname: string;
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    return null;
  }
  if (pathname !== SITEMAP_PATH) return null;

  return new Response(request.method === "HEAD" ? null : buildSitemapXml(), {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Cheap to build; cached at the edge for a day.
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
