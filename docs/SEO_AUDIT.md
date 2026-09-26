# SEO Audit — Stage 1 (no code changes yet)

Branch: `arena/01a0de0e-comrades-clinic-chat` · base commit `2f3dbd7` (main, includes PR #39)
Date: 2026-09-26

## 1. How this audit was verified

Rather than reading code only, the app was built and served locally and every route was
fetched **without executing JavaScript**, which is exactly what a crawler sees:

```bash
npm install
NITRO_PRESET=node-server npm run build   # emits .output/server/index.mjs
SESSION_SECRET=<32+ chars> node .output/server/index.mjs
curl -s localhost:3000/<route>           # HTML inspected: <head>, <h1>/<h2>, visible text
```

Findings below are from that raw HTML, plus a read of `src/routes/*` and `src/server.ts`.

## 2. Route inventory (file-based router)

There are **9 routes** — `src/routes/index.tsx` (`/`), `book.tsx`, `doctor.tsx`, `admin.tsx`,
`visits.tsx`, `wellness.tsx`, `privacy.tsx`, `terms.tsx`, `referrals.tsx` — plus the
`__root.tsx` shell. No nested/dynamic routes exist.

| #   | Path         | File            | Access                                      | SSR HTML today                                                            | Classification (proposed)       |
| --- | ------------ | --------------- | ------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------- |
| 1   | `/`          | `index.tsx`     | none (landing + patient consult flow)       | ✅ full landing: hero, services, how-it-works, trust chips (~4,000 chars) | **PUBLIC — index**              |
| 2   | `/book`      | `book.tsx`      | none (booking form; auth only to prefill)   | ✅ heading + slot picker + "KSh 150" copy (~3,100 chars)                  | **PUBLIC — index** (see Q2)     |
| 3   | `/wellness`  | `wellness.tsx`  | none (mental-health resource hub)           | ✅ crisis lines, self-care grid, when-to-see-a-doctor (~4,500 chars)      | **PUBLIC — index**              |
| 4   | `/privacy`   | `privacy.tsx`   | none (legal)                                | ✅ full policy text (~4,150 chars)                                        | **PUBLIC — index**              |
| 5   | `/terms`     | `terms.tsx`     | none (legal)                                | ✅ full terms text (~4,550 chars)                                         | **PUBLIC — index**              |
| 6   | `/referrals` | `referrals.tsx` | none, but only a "coming soon" placeholder  | ⚠️ thin (~2,500 chars, single heading)                                    | **PUBLIC but thin → noindex**   |
| 7   | `/visits`    | `visits.tsx`    | patient email OTP sign-in + private records | login card only                                                           | **PRIVATE — noindex**           |
| 8   | `/doctor`    | `doctor.tsx`    | doctor session cookie (loader gate)         | login gate only                                                           | **PRIVATE — noindex** (already) |
| 9   | `/admin`     | `admin.tsx`     | doctor session + `role === "admin"`         | login gate only                                                           | **PRIVATE — noindex** (already) |

Notes on the classification:

- `/` is a hybrid: the marketing landing and the live consultation flow share one route and are
  switched by client state. A crawler with no JS/localStorage always gets the **landing** (verified),
  so indexing `/` is safe and desirable. The consultation states are unreachable without a session.
- `/book` and `/referrals` are the only judgement calls — see open questions (Q1/Q2).
- Pages the brief lists that **do not exist yet** (additive future work): `how-it-works`, `pricing`,
  `about`, `faq`, `blog`, and a public facilities/referral-directory page. Facility data today lives
  in `src/lib/facilities.ts` + `public/facilities.json` and is only rendered inside the intake flow
  (`NearbyFacilities`, `LabOrderChoice`) — never on a crawlable page. `/referrals` is a stub, not
  facility information.

## 3. Is SSR enabled? — Yes, and public routes already render real HTML

**Confirmed: the app is server-rendered, not a client-rendered SPA.**

- `vite.config.ts` → `@lovable.dev/vite-tanstack-config` (which installs `tanstackStart`) with a
  custom server entry `src/server.ts` → `@tanstack/react-start/server-entry`; Nitro preset `vercel`.
- `npm run build` emits a real server function (`.vercel/output/functions/__server.func`) and the
  node-server build answers every route with 200 + content.
- Raw HTML evidence (no JS executed), reproduced from the running server:

| Route        | HTTP  | `<h1>`/`<h2>` in raw HTML                           | Visible text |
| ------------ | ----- | --------------------------------------------------- | ------------ |
| `/`          | 200   | `Comrades Clinic` + `See a real doctor in minutes.` | ~4.0 KB      |
| `/book`      | 200   | `Book the doctor for later`                         | ~3.1 KB      |
| `/wellness`  | 200   | `Your mind matters as much as your grades.`         | ~4.5 KB      |
| `/privacy`   | 200   | `Privacy & Patient Health Information Policy`       | ~4.2 KB      |
| `/terms`     | 200   | `Terms of Service & Patient Agreement`              | ~4.5 KB      |
| `/referrals` | 200   | `Referral program — coming soon`                    | ~2.5 KB      |
| `/visits`    | 200   | `My Visits` (sign-in card only)                     | ~2.5 KB      |
| `/doctor`    | 200\* | login gate only                                     | —            |
| `/admin`     | 200\* | login gate only                                     | —            |

\* `/doctor` and `/admin` return **500 locally only** when `SESSION_SECRET` is unset (the auth
loader throws in production mode); with the secret set they return 200. Not an SEO issue — both are
`noindex` — but worth knowing when testing locally.

So **Stage 2 is mostly hardening, not a rebuild**: the SSR mechanism works, and the data-fetching
for public content is static/marketing copy already present in the server HTML. The real Stage 2
work is the issues in §4 (heading hierarchy, hydration-only chrome leaking into crawlable text).

## 4. Gaps found (what Stages 2–5 must fix)

### 4.1 Head/meta (Stage 3)

- Root `head()` in `__root.tsx` sets a generic title/description plus `og:title`/`og:description`,
  `og:type`, `twitter:card`, and **`twitter:site: "@Lovable"`** (wrong brand — should be removed or
  replaced with a real handle; we have none in-repo, so removal is the accurate option).
- Public routes override only `title` + `description` — they **inherit the generic OG tags**, so
  sharing `/wellness` on WhatsApp/Twitter shows the homepage blurb.
- **No `<link rel="canonical">` anywhere**, and no `og:url` / `og:image` / `og:site_name` /
  `og:locale`. There is no OG image asset in `public/` (only icons + `src/assets/clinic-logo.png`,
  currently unused in markup).
- **No JSON-LD** (`application/ld+json`) on any route → no `MedicalOrganization` /
  `MedicalWebPage` / `FAQPage` / breadcrumbs.
- `robots` meta: present (`noindex, nofollow`) on `/doctor` and `/admin` only. **`/visits` has no
  robots meta** — it is currently indexable, which contradicts the brief.
- Titles/descriptions exist but are inconsistent in brand suffix (`— Comrades Clinic` vs
  `— COMRACARE Student Clinic`) and lengths are untuned.

### 4.2 robots.txt / sitemap (Stage 4)

- `public/robots.txt` currently `Allow: /` for Googlebot, Bingbot, Twitterbot,
  facebookexternalhit and `*` — i.e. **private routes are crawlable and there is no sitemap
  directive**.
- **No `sitemap.xml` exists** (`/sitemap.xml` → 404).

### 4.3 Rendering / HTML hygiene (Stage 2)

1. **Two `<h1>` per public page** — `StudentLayout` renders `<h1>Comrades Clinic</h1>` in the
   header of `/`, `/book`, `/wellness`, `/visits`, then each page adds its own hero `<h1>`. The
   header logo should become a non-heading (e.g. `<span>`/`<p>` or `<div>`), leaving one `<h1>`/page.
2. **"You are offline. Changes will sync automatically when you reconnect." is in the SSR HTML of
   every page** — `OfflineIndicator` (mounted in `__root.tsx`) defaults to offline on the server and
   only corrects itself after hydration. Crawlers read that sentence near the top of every public
   page, and it is a hydration mismatch. Fix: render nothing until mounted.
3. Root chrome (`RoleSwitcher` "Patient / Doctor portal", `IosInstallPrompt`) is SSR'd on public
   pages. `RoleSwitcher` contains an internal link to `/doctor`; harmless but it adds nav noise.
4. **Referral query strings**: the referral program uses `/?ref=CODE` (README/CHANGELOG). These are
   duplicate-content variants of `/` with no canonical and no crawl rules → canonical + a robots
   rule are needed in Stages 3/4.
5. Streaming markers: the SSR HTML contains 5 NUL bytes (TanStack Start streaming placeholders).
   Normal for the framework; noting it only because raw-HTML diffing tools treat the page as binary.

### 4.4 Performance / Core Web Vitals — early observations (full list in Stage 5)

Measured on the built `/` page:

- **29 JS `modulepreload` chunks ≈ 860 KB uncompressed / 258 KB gzip** for the landing page — the
  landing pulls in `clinic-store`, Supabase JS, `use-chat-session`, `LabResultsTracker`, the select
  components, etc., because marketing and the consult flow share one route module graph.
- **CSS 103 KB uncompressed / 16 KB gzip** (single file, fine).
- **Google Fonts stylesheet is render-blocking** (`fonts.googleapis.com/css2?family=Sora…`) with two
  preconnects. It is `display=swap` so no invisible text, but it still blocks first render and LCP;
  self-hosting or `preload` is the likely fix.
- **No images on public pages** other than the 16 px `/favicon.svg` in `RoleSwitcher`
  (`src/assets/clinic-logo.png` is unused). Nothing needs `loading="lazy"` today; when hero/OG
  imagery is added it should be `width`/`height` + `fetchpriority="high"` for LCP.
- Service worker registers on load (non-blocking) and pre-caches an app shell — fine, but it can
  mask deploys behind the cache, so after merge the owner should hard-refresh.

## 5. Proposed plan for the remaining stages (subject to your approval)

- **Stage 2 (SSR hardening, public routes only)** — single `<h1>` per public page (StudentLayout
  header becomes a `<div>`/`<p>`; the `<h1>` stays unique per page), suppress `OfflineIndicator`
  until mounted, keep all landing/service/doctor/fee copy in the server HTML. No change to
  `clinic-store` data fetching, no change to `/doctor`, `/admin`, `/visits` behaviour.
- **Stage 3 (metadata + JSON-LD)** — per-public-route `title`, `description`, canonical, `og:*`,
  `twitter:*`; remove `twitter:site: "@Lovable"`; JSON-LD `MedicalOrganization` on `/` (name,
  url, logo, area served = Kenya, `availableService` for chat/voice-video/prescriptions/labs/
  referrals, fee range KSh 150–250 from `CONSULT_FEE_KES`/`THERAPY_FEE_KES`), `MedicalWebPage` on
  `/wellness` (and on the new content pages if we add them), `WebPage`/breadcrumbs on legal pages,
  `FAQPage` only if/when real FAQ content exists. All claims taken from the repo
  (`DOCTOR.name`/`kmpdc_license` "A.84920", fees, services, crisis lines) — nothing invented.
- **Stage 4 (crawl)** — rewrite `public/robots.txt` (allow public, `Disallow` `/doctor`, `/admin`,
  `/visits`, plus `/*?ref=` on `/`), and add a build-time sitemap. Two options to choose from:
  (a) `public/sitemap.xml` generated by a small script wired into `npm run build`
  (e.g. `scripts/generate-sitemap.mjs`, plain Node, no new dependency), or
  (b) a `/sitemap.xml` route served by TanStack Start so it is always in sync with the router.
  Both need the canonical host — see Q3.
- **Stage 5 (CWV report only)** — quantified list with priorities; no changes without your sign-off.

## 6. Open questions before Stage 2

1. **`/referrals`** — treat as thin content and `noindex` it (my recommendation) or index it anyway?
2. **`/book`** — keep indexable (it has genuine service copy: how booking works, KSh 150, Nairobi
   time) or `noindex` it as a transactional form?
3. **Canonical host** — `.env.example` only hints at `https://comracare.co.ke`. Please confirm the
   exact production origin (and whether it redirects the `*.vercel.app` domain to it); canonicals,
   OG URLs and the sitemap depend on it. Proposal: read `SITE_URL` from env with
   `https://comracare.co.ke` as the committed default.
4. **New public pages** — the brief mentions how-it-works / pricing / about / FAQ / facilities.
   They don't exist yet. Create them additively in this PR (scope grows), or keep this PR to
   hardening the existing five public routes and add content pages later?

## 7. Files changed in Stage 1

- **Added**: `docs/SEO_AUDIT.md` (this report).
- **Changed**: none — no application code touched.

Untracked build output (`.vercel/`, `.output/`) is gitignored and will be removed before commit.

---

# Stage 2 results — SSR hardening + public content pages

Verified the same way as Stage 1 (built with `NITRO_PRESET=node-server`, fetched with curl /
Python `urllib`, no JavaScript executed).

## What changed

| Area                 | Change                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heading hierarchy    | `StudentLayout` header wordmark is no longer an `<h1>` (it is a `<span>`), so each public page has exactly **one** `<h1>`. Intake form step titles moved `h3 → h2`; `/visits` page title is now the `<h1>` with the sign-in card as an `<h2>`.                 |
| SSR content hygiene  | `OfflineIndicator` renders **nothing** until the browser mounts _and_ the visitor is actually offline. Previously every page's server HTML contained "You are offline. Changes will sync automatically when you reconnect." (and it was a hydration mismatch). |
| New public pages     | `/how-it-works`, `/pricing`, `/facilities`, `/faq`, `/about` — all rendered from static content on the server, no Supabase reads at render time.                                                                                                               |
| Internal linking     | `PublicPageLayout` header + footer nav on every new page, and a new "Clinic information" nav row in the `StudentLayout` footer, so the whole public set is reachable from `/` (and from every app page) with plain `<a href>` links.                           |
| Shared SEO constants | `src/lib/site.ts` holds the canonical origin, `PUBLIC_ROUTES`, `PUBLIC_NAV` and `PRIVATE_ROUTE_PREFIXES` for Stages 3–4. FAQ copy in `src/lib/faq-content.ts` (also the future FAQPage source).                                                                |
| Build                | `src/routeTree.gen.ts` regenerated by the router plugin (generated file — never hand-edit).                                                                                                                                                                    |

## Measurements (raw HTML, JS disabled)

| Route           | Bytes  | Visible text | `<h1>` | `<h2>` | "You are offline" in HTML |
| --------------- | ------ | ------------ | ------ | ------ | ------------------------- |
| `/`             | 36,115 | 1,878        | 1      | 2      | no                        |
| `/how-it-works` | 29,776 | 4,804        | 1      | 5      | no                        |
| `/pricing`      | 26,860 | 3,448        | 1      | 5      | no                        |
| `/facilities`   | 29,349 | 3,755        | 1      | 5      | no                        |
| `/faq`          | 32,784 | 6,063        | 1      | 17     | no                        |
| `/about`        | 28,985 | 4,506        | 1      | 6      | no                        |
| `/wellness`     | 33,009 | 2,724        | 1      | 3      | no                        |
| `/book`         | 30,997 | 1,297        | 1      | 2      | no                        |
| `/terms`        | 17,260 | 2,818        | 1      | 6      | no                        |
| `/privacy`      | 16,356 | 2,421        | 1      | 6      | no                        |
| `/referrals`    | 13,127 | 827          | 1      | 0      | no                        |
| `/visits`       | 18,709 | 619          | 1      | 0      | no                        |
| `/doctor`       | 20,809 | 895          | 1      | 0      | no                        |
| `/admin`        | 19,243 | 895          | 1      | 0      | no                        |

Correction to Stage 1: the "visible text" column there included the inline `<script>` bodies, which
inflated every figure (e.g. `/` read as ~4,000 chars instead of 1,878). The numbers above strip
scripts, so they are the honest crawler-visible text sizes. The Stage 1 conclusions are unchanged —
the issue was the duplicated `<h1>` and the offline sentence, both now fixed.

## Still to come

- **Stage 3**: canonical, `og:*` (per page), `og:image`, `twitter:*` cleanup (`twitter:site` is
  still `@Lovable` in the root head), JSON-LD (`MedicalOrganization` on `/` and `/about`,
  `MedicalWebPage` on `/wellness` + service pages, `FAQPage` on `/faq`), plus `noindex` on
  `/referrals` and the private routes where it is missing.
- **Stage 4**: `public/robots.txt` rewrite (disallow `/doctor`, `/admin`, `/visits`, `/*?ref=`) and
  a build-time `sitemap.xml` generated from `PUBLIC_ROUTES` in `src/lib/site.ts`.
- **Stage 5**: Core Web Vitals report — the public pages add no images and no third-party scripts;
  the known cost is the shared client bundle + the render-blocking Google Fonts stylesheet, both
  unaffected by this stage and still to be quantified.

---

# Stage 3 results — per-route metadata and structured data

Implemented in `src/lib/seo.ts`; every public route now calls `seoHead({ title, description, path,
schema })`, which emits the title, description, a self-referential canonical, the full Open Graph
set (`og:title/description/url/type/site_name/locale/image` + image dimensions/alt), the Twitter
card, and one `@graph` JSON-LD block. Private routes use the same helper with `noindex: true`.

## Per-route metadata

| Route               | Title                                                                   | JSON-LD                            |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| `/`                 | Comrades Clinic — online doctor chat for Kenyan students                | `MedicalOrganization`, `WebSite`   |
| `/how-it-works`     | How it works — see a doctor online in Kenya \| Comrades Clinic          | `MedicalWebPage`                   |
| `/pricing`          | Pricing — KSh 150 general, KSh 250 therapy \| Comrades Clinic           | `MedicalWebPage`, `OfferCatalog`   |
| `/facilities`       | Find care near campus: hospitals, labs & referrals \| Comrades Clinic   | `MedicalWebPage`                   |
| `/faq`              | FAQ — fees, privacy, prescriptions & labs \| Comrades Clinic            | `FAQPage` (16 questions)           |
| `/about`            | About — KMPDC-registered student telemedicine \| Comrades Clinic        | `MedicalOrganization`, `AboutPage` |
| `/wellness`         | Wellness Hub — free mental health support for students                  | `MedicalWebPage`                   |
| `/book`             | Book an appointment with a doctor online \| Comrades Clinic             | `MedicalWebPage`                   |
| `/terms`            | Terms of Service \| Comrades Clinic                                     | `WebPage`                          |
| `/privacy`          | Privacy Policy — health data under Kenya's DPA \| Comrades Clinic       | `WebPage`                          |
| `/referrals`        | Referral programme — not open yet \| Comrades Clinic                    | none — **noindex**                 |
| `/visits`           | My Visits — sign in to see your consultation history \| Comrades Clinic | none — **noindex**                 |
| `/doctor`, `/admin` | unchanged (already `noindex, nofollow`)                                 | none                               |

Root head cleanup: removed `twitter:site: "@Lovable"`; added `og:site_name` and `og:locale`; changed
the root `twitter:card` to `summary`. Root `og:*`/`title` remain only as fallbacks — TanStack Router
dedupes by `name`/`property` with the deepest route winning, which the verification run confirms
(exactly one `og:title` per page, and the route's value, not the root default).

## Accuracy guardrails for the structured data

- Fees come from `CONSULT_FEE_KES` / `THERAPY_FEE_KES` in `src/lib/clinic-types.ts`; the clinician
  name, title and KMPDC number come from `DOCTOR`. No statistic, rating, review, opening hours,
  certification or address is asserted anywhere — the repo has none.
- **No phone numbers in JSON-LD.** The helpline and Pochi numbers live in the `clinic_settings`
  row and can change without a deploy, so publishing them as structured data would go stale; the
  visible pages still show them.
- `PrivacyPolicy` and `TermsOfService` are **not** schema.org types (still open proposals —
  schemaorg/suggestions-questions-brainstorming#59), so `/terms` and `/privacy` use `WebPage`.
- `medicalSpecialty` uses the confirmed enumeration members `https://schema.org/PrimaryCare` and
  `https://schema.org/Psychiatric` (general consultations + psychiatrist therapy).
- `og:image` is the existing 512×512 app icon (`/icons/icon-512.png`) — a real shipped brand asset —
  so `twitter:card` is `summary`, not `summary_large_image`. A purpose-built 1200×630 OG image is a
  design task, not something to fake with a generator.

## Verification (raw HTML, JS disabled)

| Route           | `<title>` | description | canonical | og:title | JSON-LD                            | robots              |
| --------------- | --------- | ----------- | --------- | -------- | ---------------------------------- | ------------------- |
| `/`             | 1         | 1           | 1         | 1        | `MedicalOrganization`, `WebSite`   | —                   |
| `/how-it-works` | 1         | 1           | 1         | 1        | `MedicalWebPage`                   | —                   |
| `/pricing`      | 1         | 1           | 1         | 1        | `MedicalWebPage`, `OfferCatalog`   | —                   |
| `/facilities`   | 1         | 1           | 1         | 1        | `MedicalWebPage`                   | —                   |
| `/faq`          | 1         | 1           | 1         | 1        | `FAQPage`                          | —                   |
| `/about`        | 1         | 1           | 1         | 1        | `MedicalOrganization`, `AboutPage` | —                   |
| `/wellness`     | 1         | 1           | 1         | 1        | `MedicalWebPage`                   | —                   |
| `/book`         | 1         | 1           | 1         | 1        | `MedicalWebPage`                   | —                   |
| `/terms`        | 1         | 1           | 1         | 1        | `WebPage`                          | —                   |
| `/privacy`      | 1         | 1           | 1         | 1        | `WebPage`                          | —                   |
| `/referrals`    | 1         | 1           | 0         | 1        | —                                  | `noindex, nofollow` |
| `/visits`       | 1         | 1           | 0         | 1        | —                                  | `noindex, nofollow` |
| `/doctor`       | 1         | 1           | 0         | 1        | —                                  | `noindex, nofollow` |
| `/admin`        | 1         | 1           | 0         | 1        | —                                  | `noindex, nofollow` |

Every canonical/`og:url` matches the route path on the canonical origin
(`https://comrades-clinic-chat-six.vercel.app` today — one constant, or `VITE_SITE_URL`). Each
JSON-LD block parses as valid JSON and the whole graph is emitted through TanStack Router's
`script:ld+json` meta entry, which HTML-escapes the payload.

## Still to come

- **Stage 4**: `public/robots.txt` (disallow `/doctor`, `/admin`, `/visits`, `/*?ref=`) and a
  build-time `sitemap.xml` generated from `PUBLIC_ROUTES` (10 URLs, `/referrals` excluded).
- **Stage 5**: Core Web Vitals — render-blocking Google Fonts stylesheet and the shared landing
  bundle are the two items to quantify.

---

# Stage 4 results — robots.txt and sitemap.xml

## robots.txt (static, `public/robots.txt`)

Replaced the previous blanket `Allow: /` for every user agent:

```
User-agent: *
Allow: /
Disallow: /doctor
Disallow: /admin
Disallow: /visits
Sitemap: https://comrades-clinic-chat-six.vercel.app/sitemap.xml
```

Two deliberate decisions:

- **`/referrals` is not disallowed.** It carries `noindex, nofollow` in its HTML, and a crawler can
  only see that directive if it is allowed to fetch the page — disallowing a noindex page is the
  classic contradiction that leaves URL-only entries in the index. The comment in the file says to
  remove the noindex on that route when the referral programme launches.
- **`/?ref=CODE` is not disallowed either**, for the same reason: those invite links are duplicate
  versions of `/` and already consolidate through the canonical tag added in Stage 3. A
  commented-out `Disallow: /*?ref=` line is left in the file for the owner to enable if Search
  Console ever reports crawl waste on referral URLs.

## sitemap.xml (generated, `/sitemap.xml`)

Generated from `PUBLIC_ROUTES` in `src/lib/site.ts` and served by the app's own server entry
(`sitemapResponse()` in `src/lib/sitemap.ts`, wired into `src/server.ts`), instead of a committed
build artefact:

- **Single source of truth** — the same list drives the header/footer navigation, so the sitemap
  cannot drift from the routes that exist, and no generated file has to be committed or gitignored
  (and `package.json` — which may not be committed — stays untouched, so a `prebuild` hook was not
  an option).
- **Always current** — it is rebuilt on request (`cache-control: public, max-age=3600,
s-maxage=86400`), so adding a public route + a `PUBLIC_ROUTES` entry is enough.
- **No `lastmod`** — nothing in the app tracks per-page modification times, and a wrong `lastmod`
  is worse than none. `changefreq` and `priority` come from `PUBLIC_ROUTES`.
- Content type is `application/xml; charset=utf-8`; `HEAD` returns the same headers with no body.

Verified output: 10 URLs — `/`, `/how-it-works`, `/pricing`, `/facilities`, `/faq`, `/about`,
`/wellness`, `/book`, `/terms`, `/privacy`.

## Automated cross-checks (run against the built server)

| Check                                                                          | Result              |
| ------------------------------------------------------------------------------ | ------------------- |
| Sitemap XML is well-formed (parsed with an XML parser)                         | pass                |
| Every indexable route in `src/routes/*` appears in the sitemap                 | pass (none missing) |
| No `noindex` route appears in the sitemap                                      | pass (none leaked)  |
| Every sitemap URL maps to a real route                                         | pass (none unknown) |
| Every `Disallow` path is a route that also sends `noindex`                     | pass                |
| `Sitemap:` directive present and pointing at `/sitemap.xml`                    | pass                |
| `/sitemap.xml` returns 200 + `application/xml` (prod build **and** `vite dev`) | pass                |
| `/robots.txt` still served from `public/`                                      | pass (text/plain)   |

## Note for the owner

`robots.txt` is a static file, so its `Sitemap:` line contains the current canonical origin. When
the site moves to its own domain, update that one line (and `VITE_SITE_URL` / `FALLBACK_ORIGIN` in
`src/lib/site.ts`) — the sitemap's `<loc>` URLs follow `SITE_ORIGIN` automatically.

---

# Stage 5 results — performance / Core Web Vitals review (measurements only, no changes applied)

Measured on the production build (`NITRO_PRESET=node-server`), serving locally and reading what the
browser would actually fetch: per-route `modulepreload` graph, gzip sizes of every chunk, the head's
resource inventory, and the script/overlay structure. Two things could not be measured from this
sandbox and are flagged as such: **font file sizes** (no network egress to `fonts.googleapis.com`)
and **real-world field metrics** (need PageSpeed Insights / CrUX against the deployed URL).

## Transfer profile of the public pages

| Route           | JS chunks | JS gzip      | CSS raw (gzip ≈16 KB) | HTML    | Third-party blocking requests |
| --------------- | --------- | ------------ | --------------------- | ------- | ----------------------------- |
| `/`             | 42        | **264.8 KB** | 103.3 KB              | 38.5 KB | 1 (Google Fonts CSS)          |
| `/book`         | 20        | 215.3 KB     | 103.3 KB              | 32.2 KB | 1                             |
| `/facilities`   | 22        | 202.5 KB     | 103.3 KB              | 30.6 KB | 1                             |
| `/wellness`     | 19        | 203.6 KB     | 103.3 KB              | 34.3 KB | 1                             |
| `/how-it-works` | 18        | 198.5 KB     | 103.3 KB              | 30.8 KB | 1                             |
| `/about`        | 16        | 197.9 KB     | 103.3 KB              | 31.9 KB | 1                             |
| `/pricing`      | 16        | 197.4 KB     | 103.3 KB              | 28.5 KB | 1                             |
| `/terms`        | 14        | 197.3 KB     | 103.3 KB              | 18.7 KB | 1                             |
| `/privacy`      | 14        | 197.1 KB     | 103.3 KB              | 18.0 KB | 1                             |
| `/faq`          | 12        | 197.0 KB     | 103.3 KB              | 39.5 KB | 1                             |

## Finding 1 — the Supabase client and the clinic store ship to every public page (biggest win)

Every public page — including `/terms` and `/privacy` — loads the same 10-chunk baseline of
**194 KB gzip**, and 63 KB of it has no business on a static information page:

| Chunk                                 | gzip        | Needed on `/terms`, `/faq`, `/how-it-works`? |
| ------------------------------------- | ----------- | -------------------------------------------- |
| `index-*.js` (React + router + Query) | 103.5 KB    | yes — the app shell                          |
| `supabase-*.js`                       | **52.7 KB** | **no**                                       |
| `createServerFn-*.js`                 | 11.7 KB     | yes — routing                                |
| `clinic-store-*.js`                   | **10.0 KB** | **no**                                       |
| `link-*.js`, `react-*.js`, misc       | 16.3 KB     | yes                                          |

Cause: `EmergencyContactsBar` and `WhatsAppFallback` (used by both `PublicPageLayout` and
`StudentLayout`) call `useClinic()` to read `clinic_settings.helpline_phone` /
`clinic_settings.whatsapp_number` — and importing the clinic store pulls the Supabase client, the
realtime/WebSocket stack, `crypto` helpers and the whole consult-flow reducer into the graph of
every page that renders a header.

**Proposal (not applied):** let those two components accept an optional override and use the
committed defaults (`src/lib/whatsapp.ts`, `src/components/clinic/EmergencyContacts.tsx`) on public
pages, keeping `useClinic()` only inside the app routes. Expected: **−63 KB gzip (−32%) on every
public page**, and no Supabase/Realtime client on crawlable pages at all. Effort: small; risk: low
(the app routes keep today's behaviour — needs a check that nothing else in the public graph
imports the store transitively).

## Finding 2 — `/` ships the whole consultation flow to visitors who may never start one

`/` is 42 chunks / 264.8 KB gzip. 32 of those chunks (**+70.6 KB gzip**) exist only because the
marketing landing and the live consult flow share one route module: `dist-*.js` 19.3 KB,
`routes-*.js` 16.8 KB, `select-*.js` 9.6 KB, `use-chat-session-*.js` 6.8 KB,
`kenya-institutions-*.js` 4.2 KB, `LabResultsTracker`, `facilities`, `StudentLayout`, etc.

**Proposal (not applied):** `React.lazy()` the consult-only components (IntakeForm, ChatWindow,
VideoCall, LabOrderChoice, LabResultsTracker, MpesaProcessing, MoodCheckIn, DocumentTemplates) so
they load when the visitor taps "Continue to Consultation Intake". Expected: up to **−70 KB gzip off
first load of `/`**; LCP there is the hero headline, so this mainly improves TBT/INP headroom on
budget Android phones. Effort: medium; risk: medium — this touches the consultation route's
component graph, so it must be verified against the "don't change data-fetching for PRIVATE routes"
rule (lazy loading is presentational, but `/doctor`, `/admin`, `/visits` and the chat flow need a
smoke test after).

## Finding 3 — one render-blocking third-party request (fonts)

The head contains a cross-origin, render-blocking stylesheet for **7 declared weights** across two
families (`Sora 500/600/700`, `Plus Jakarta Sans 400/500/600/700`), fetched from
`fonts.googleapis.com`, with preconnects to both Google hosts. That is a blocking round trip before
first paint on a page whose LCP element is **text** (the hero headline — there is no hero image).

**Proposal (not applied):** self-host the woff2 files actually used (drop unused weights), add
`font-display: swap` + `preload` for the two weights above the fold, and optionally add
`size-adjust`/fallback metrics to cut swap reflow. Expected: one fewer blocking cross-origin
request (~100–300 ms on mobile) and a more stable text LCP. Effort: medium (font files land in
`public/`, ~50–80 KB); risk: low; needs your sign-off on adding font binaries to the repo. If you
prefer zero new binaries, the fallback is keeping Google Fonts but dropping unused weights.

## Finding 4 — things that are already fine (no action)

- **No images on public pages.** The only `<img>` is the 16 px decorative `/favicon.svg` in
  `RoleSwitcher` (`aria-hidden`). Nothing needs `loading="lazy"`/dimensions, and there is no LCP
  image to prioritise.
- **No heavy third-party chat widgets.** WhatsApp is a plain `wa.me` link; Jitsi loads only when a
  call starts; Supabase is first-party. `facilities.json` (933 KB) is fetched only when a visitor
  taps "Load directory" — confirmed by the on-demand loader in `FacilityDirectory`.
- **App JavaScript does not block rendering.** 4 script tags total: the async `type="module"`
  bundle, an inline bootstrap, the streaming barrier, plus the JSON-LD block (data, not script).
- **No layout-shift risk from overlays.** `OfflineIndicator` and `IosInstallPrompt` are
  `position: fixed` and the offline banner now renders nothing until mounted (Stage 2).
- **CSS is 103 KB raw but 16 KB gzip** — Tailwind output, single file, acceptable.
- **Sitemap cost is negligible**: statically generated per request, no database access.

## Proposed order of work (your call — nothing applied yet)

1. **Finding 1** — largest saving, smallest blast radius (−63 KB gzip/page, touches two components).
2. **Finding 2** — −70 KB gzip on `/`, but needs a consult-flow smoke test.
3. **Finding 3** — fonts; needs a decision on committing font binaries.
4. **Field verification** — after merge, run PageSpeed Insights/CrUX on the live URL and watch
   Search Console coverage for the 10 sitemap URLs. No code change.

Reminder that applies to every one of these: the service worker caches static assets cache-first, so
after a deploy do a hard refresh (and re-run Lighthouse with "clear storage").
