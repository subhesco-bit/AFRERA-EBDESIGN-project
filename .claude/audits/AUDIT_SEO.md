---
agent: seo-auditor
status: warn
findings: 7
---

# SEO Audit — AFRERA Platform

## Summary

This repository is dominated by internal planning/specification documents (dozens of `AFRERA_*.md`, `EVGA_*.md`, `TISMP_*.md` files at the root) and an `afrera/` tree that is mostly stub directories (e.g. `afrera/afrera-web/src` is a single text file containing an ASCII tree diagram, not real source code). The one **real, buildable** frontend is `frontend/` — a Vite + React single-page application (`afrera-frontend`, confirmed via `frontend/package.json`).

This app is **not purely internal** — it does have genuine public-facing surface area. `frontend/src/App.jsx` explicitly marks a "Public Routes" section and, per in-code comments, was deliberately amended so a first-time visitor could reach some pages "without an account": `/`, `/marketplace`, `/products/:id`, `/login`, `/register`, `/farmer-entrance` (+ 4 sub-doors), `/pricing/forward`, `/climate`, `/corridor-economics`, `/land-use`, `/experience`, `/pricecheck`, `/pricebuild`, `/dynamicpricing`, `/selltiming`, `/compare`, `/discover`. Everything else (dashboards, ledger, insurance, logistics, ~150 numbered `/modules/mNNN` admin routes, etc.) sits behind `ProtectedRoute`.

Because this is a client-rendered SPA with a single `frontend/index.html` shell and no server-side rendering, static prerendering, or per-route `<head>` management (no `react-helmet`/`react-helmet-async` or equivalent found in `frontend/package.json` or `frontend/src`), **every route — public or protected — serves the exact same title, meta description, and Open Graph/Twitter tags.** There is no per-page SEO differentiation possible today, and no JSON-LD structured data anywhere in the codebase (`frontend/`, `backend/`, `afrera/`).

Overall status: **warn**. The base tags that exist are reasonable for a single-page manifest but are static/shared across all routes, there is no structured data, no `robots.txt`/`sitemap.xml`, no `og:image`, no canonical tags, and the favicon reference is broken. None of this is launch-blocking in the security sense, but none of the public routes (home, marketplace, product pages, farmer-entrance doors, forward pricing, climate) are optimized for search/social discovery, which matters for a platform whose own comments describe these routes as a "public discovery layer."

## Findings

### 1. No per-page `<title>` / meta description — all routes share one static tag set
- **Severity:** High
- **Location:** `frontend/index.html` (lines 6–31), `frontend/src/App.jsx` (all `<Route>` definitions)
- **Description:** The SPA has one `index.html` with one `<title>AFRERA Platform</title>` and one static `<meta name="description">`. There is no `react-helmet`/`react-helmet-async`/`<title>` mutation logic in `frontend/src` (confirmed via search — no matches for `Helmet`, `document.title`, or similar). This means the home page, the marketplace, every individual product page (`/products/:id`), the farmer-entrance doors, and the forward-pricing/climate pages all present identically to search engines and to anyone sharing a link — e.g. a shared product URL shows the generic "AFRERA Platform" title and platform-wide description instead of the product name/price.
- **Remediation:** Add `react-helmet-async` (or React 19's native `<title>`/`<meta>` support if upgrading) and set route-specific title/description in each public page component, especially `ProductDetailPage.jsx` and `MarketplacePage.jsx` where content is dynamic per item/query.

### 2. No JSON-LD structured data anywhere in the codebase
- **Severity:** High
- **Location:** repo-wide (`frontend/`, `backend/`) — no `application/ld+json` found
- **Description:** There is zero structured data. For an e-commerce/marketplace surface (`MarketplacePage.jsx`, `ProductDetailPage.jsx`) this means no `Product`, `Offer`, or `BreadcrumbList` schema; for the org itself, no `Organization`/`WebSite` schema on the home page. Search engines cannot produce rich results (price, availability, ratings) for product pages, and there's no sitelinks-searchbox eligibility for the site.
- **Remediation:** Add `Organization`/`WebSite` JSON-LD to the home page shell, and `Product`/`Offer` JSON-LD to `ProductDetailPage.jsx` sourced from the same data already fetched for rendering (avoids a second data source to keep in sync).

### 3. No `og:image` / `twitter:image`
- **Severity:** Medium
- **Location:** `frontend/index.html` (Open Graph block, lines 20–29)
- **Description:** Open Graph and Twitter Card tags exist for title/description/type/locale, but neither `og:image` nor `twitter:image` is set. Shared links (WhatsApp, Twitter/X, LinkedIn, Facebook) will render with no preview image — significant for reach in the stated "rural India" market where link previews are often the only signal a recipient sees before clicking. `twitter:card` is set to `summary_large_image`, which specifically expects an image; without one, most clients fall back to a degraded card or none at all.
- **Remediation:** Add a real static `og:image`/`twitter:image` (absolute URL, ≥1200×630px) under `frontend/public/`, referenced with an absolute URL (OG tags require absolute, not relative, URLs — currently no domain is configured anywhere in `index.html`, so even a relative image path would not resolve correctly for crawlers).

### 4. Favicon reference is broken (`/vite.svg` does not exist)
- **Severity:** Medium
- **Location:** `frontend/index.html:5` — `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`
- **Description:** `frontend/public/vite.svg` does not exist (confirmed via directory listing — `frontend/public` contains only `icons/`, `manifest.json`, `manifest.webmanifest`, `sw.js`). This is the default Vite scaffold favicon reference, left over and never replaced. Every page load will 404 on the favicon request; browsers show a blank/broken tab icon, and it undermines basic polish on a page explicitly built for first-time, low-trust visitors ("public discovery layer" per the code comments).
- **Remediation:** Point the favicon at one of the existing real assets (`frontend/public/icons/icon-192.png` or similar) or add a proper `favicon.ico`/`favicon.svg` matching the brand.

### 5. No `robots.txt` or `sitemap.xml`
- **Severity:** Medium
- **Location:** repo-wide — searched `frontend/public`, `backend/src` (including `index.js`) for `robots.txt`/`sitemap` route or static file; none found
- **Description:** There is no `robots.txt` to guide crawlers away from the ~150 authenticated `/modules/mNNN` admin routes and other protected paths, and no `sitemap.xml` to help search engines discover the genuinely public routes (`/`, `/marketplace`, `/products/:id`, `/farmer-entrance*`, `/pricing/forward`, `/climate`, `/corridor-economics`, `/land-use`, `/experience`, etc.). Since this is a client-side-routed SPA, crawlers depend entirely on links and sitemap entries to discover deep routes like individual product pages.
- **Remediation:** Add `frontend/public/robots.txt` (allow the public routes listed in `App.jsx`'s "Public Routes" section; the protected/admin routes are moot for robots.txt since they already 302/redirect unauthenticated crawlers to `/login` via `ProtectedRoute`, but explicit disallow rules avoid wasted crawl budget) and a generated `sitemap.xml` covering the public route list, updated as new public routes are added.

### 6. Duplicate, drifted PWA manifest files (`manifest.json` vs `manifest.webmanifest`)
- **Severity:** Low
- **Location:** `frontend/public/manifest.json` and `frontend/public/manifest.webmanifest`
- **Description:** Two manifest files exist with different `name` ("AFRERA Platform" vs "AFRERA — Agriculture & Rural Economy Platform"), different `theme_color` (`#10b981` vs `#16a34a`), different `description`, and different shortcut sets. Only `manifest.webmanifest` is linked from `index.html:13`, so `manifest.json` is dead/orphaned — but its presence is a landmine for whoever next "fixes" the manifest and edits the wrong file, and some tooling/crawlers that probe for `manifest.json` by convention could pick up the stale one. Not a strict SEO defect but adjacent to the OG/PWA discoverability surface being audited.
- **Remediation:** Delete the unused `manifest.json` or explicitly document why both exist; keep a single source of truth for name/theme_color consistent with `index.html`'s `<meta name="theme-color" content="#16a34a">`.

### 7. No canonical URL tags
- **Severity:** Low
- **Location:** `frontend/index.html` — no `<link rel="canonical">` anywhere
- **Description:** No canonical tags exist on any page. Low impact today since there's only one static `index.html` and no query-string-driven duplicate-content routes have been observed, but becomes relevant once per-page titles (Finding #1) are implemented and if `MarketplacePage.jsx`/`DiscoverPage.jsx` filtering ever produces indexable, differently-parameterized URLs for the same underlying content.
- **Remediation:** Add canonical tags once per-route `<head>` management (Finding #1's fix) is in place; point each canonical at its clean, parameter-free path.

## Metrics

| Metric | Value |
|---|---|
| Real frontend apps found | 1 (`frontend/` — Vite + React SPA) |
| Total HTML entry points | 1 (`frontend/index.html` — single shell for all routes) |
| Public (unauthenticated) routes in `App.jsx` | ~17 top-level paths (home, marketplace, product detail, login, register, 4 farmer-entrance doors, forward pricing, climate, corridor economics, land-use, experience, price check/build, dynamic pricing, sell timing, compare, discover) |
| Protected/authenticated routes in `App.jsx` | ~180+ (dashboards, ledger, insurance, logistics, ~150 numbered `/modules/mNNN` admin routes, etc.) |
| Pages with unique `<title>`/meta description | 0 of ~17 public routes (all share the one static `index.html` tag set) |
| JSON-LD structured data blocks found | 0 |
| `og:image` / `twitter:image` present | No |
| `robots.txt` present | No |
| `sitemap.xml` present | No |
| Canonical tags present | No |
| Favicon resolves | No (`/vite.svg` referenced, file does not exist) |
| PWA manifest files present | 2, mutually inconsistent (`manifest.json`, `manifest.webmanifest`) — only the latter is linked |
