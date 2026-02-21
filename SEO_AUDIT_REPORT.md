# Technical SEO Audit Report — gamelayer.io

**Date:** 2025-02-21  
**Goal:** Diagnose ranking drop and implement minimal technical fixes. Arabic metadata has been removed; this audit focuses on **technical SEO** (canonical, robots, sitemap, redirects, duplicate URLs, hreflang).

**Constraints:** No design, content, copy, layout, pricing, or functionality changes. Crawlability/indexing only.

---

## 1) Inventory Summary

| Item | Location | Notes |
|------|----------|--------|
| **Framework** | Astro 3, `output: 'server'` (Vercel) | SSR; pages rendered server-side. |
| **Site URL** | `astro.config.mjs`: `site: 'https://gamelayer.io'` | Single preferred origin. |
| **robots.txt** | `public/robots.txt` | Allows all; Sitemap: `https://gamelayer.io/sitemap.xml`. |
| **Sitemap** | Custom `src/pages/sitemap.xml.ts` (API route) | Served at `/sitemap.xml`. |
| **Sitemap (integration)** | `@astrojs/sitemap` in `astro.config.mjs` | **Also** generates `sitemap-index.xml` + `sitemap-0.xml` in build. |
| **Canonical / SEO** | `src/lib/seo.ts` (`buildSeo`, `LIVE_SITE_URL`) | Canonical built as `https://gamelayer.io` + pathname (no trailing slash). |
| **Layout &lt;head&gt;** | `src/layouts/Layout.astro` | Title, description, canonical, robots, OG, Twitter. |
| **Redirects** | `vercel.json` | **No redirects** in repo; http→https / www→non-www not defined here (must be Vercel project/host). |
| **Hosting** | Vercel | Headers in `vercel.json` (CSP, X-Frame-Options, etc.). No X-Robots-Tag. |

---

## 2) Automated Checks (Findings)

| Check | Result |
|-------|--------|
| **noindex / nofollow** | `Layout.astro`: `noindex` prop → `noindex, nofollow` when true. **Only `/pricing`** uses `noindex={true}` (intentional). |
| **X-Robots-Tag** | Not set in `vercel.json` or code. No conflict with meta robots. |
| **robots.txt** | Present; allows `*`; Sitemap URL correct. |
| **canonical** | **Issue:** Layout defaults to `canonical = Astro.url.href`. Pages that **don’t** pass canonical: about, get-started, terms-of-service, privacy-policy, dpa, blog/[slug], blog/page/[page], agent. So on www / trailing-slash / alternate host, canonical can be **wrong**. |
| **hreflang** | **None** in codebase. No leftover Arabic or other locale tags. |
| **lang=** | `<html lang="en">` in Layout and a couple of standalone pages. No conflicting language tags. |
| **Redirects** | No 301/302 in `vercel.json`. `features.ts` / `customers.ts` 301 to `/#...`. Blog slug/page redirect to `/blog` for invalid. |
| **Duplicate base URLs** | All SEO/canonical use `gamelayer.io`. `external.ts` uses `app.gamelayer.co` and `contact@gamelayer.co` (app/email, not site identity). No mixed .co/.io for site URLs. |
| **Sitemap URL format** | Custom sitemap uses **trailing slashes** (e.g. `https://gamelayer.io/blog/`). `seo.ts` canonical uses **no trailing slash** (e.g. `https://gamelayer.io/blog`). **Mismatch → duplicate URL risk.** |

---

## 3) Canonical & Indexability

- **Homepage, /blog, /api-docs:** Use `buildSeo()` and pass explicit `canonical` → correct.
- **About, get-started, terms, privacy, dpa, blog post, blog pagination:** Do **not** pass canonical → fallback to `Astro.url.href` (request URL). If user hits `https://www.gamelayer.io/about/`, canonical would be that URL instead of `https://gamelayer.io/about`.
- **Robots:** Only `/pricing` is noindex; rest indexable. No conflicting X-Robots-Tag.

**Fix:** Pass explicit canonical (from `buildSeo` or same base URL logic) on all indexable pages so canonical is always `https://gamelayer.io/...` with consistent path (no trailing slash).

---

## 4) Hreflang

- No hreflang tags in repo. No Arabic (or other) alternate links. Nothing to remove or fix.

---

## 5) Sitemap & Robots

- **robots.txt:** Correct; allows crawl; Sitemap: `https://gamelayer.io/sitemap.xml`.
- **Two sitemap sources:**
  - Custom API route: `/sitemap.xml` (referenced in robots.txt). Uses trailing slashes; includes homepage, blog, api-docs, about, blog pagination, blog posts, privacy, terms, dpa. **Missing:** get-started.
  - **@astrojs/sitemap:** Build produces `sitemap-index.xml` and `sitemap-0.xml` with **trailing slash** URLs and includes **admin**, **agent-test**, **pricing**. So:
  - Duplicate/overlapping URL sets.
  - Integration exposes admin and noindex pricing.
  - Two different URL shapes (only one is in robots.txt, but the other is still reachable).

**Fix:** (1) Remove `@astrojs/sitemap` so only the custom sitemap exists. (2) In custom sitemap, use **no trailing slash** for all `<loc>` to match canonical. (3) Add get-started to custom sitemap.

---

## 6) Redirects & Duplicate URL Variants

- **vercel.json:** No redirects. Preferred host/scheme not enforced in repo.
- **Recommendation (host-level):** Ensure on Vercel (or DNS): **301** from `http://gamelayer.io` → `https://gamelayer.io`, and **301** from `https://www.gamelayer.io` → `https://gamelayer.io` (or chosen standard). Trailing slash: Astro default `trailingSlash: 'ignore'` so both `/blog` and `/blog/` can 200; canonical should be one format (we use no trailing slash) and sitemap should list that same format.

No .co→.io redirect in repo; if gamelayer.co is a separate product/app, keep as-is.

---

## 7) Rendering & Build

- Build succeeds. Astro SSR renders full HTML; no blank shell.
- Warnings: `getStaticPaths()` ignored for blog/[slug] and blog/page/[page] (expected in server mode).
- No 404/500 observed for key routes in config.

---

## 8) Root Cause Hypotheses (Ranked)

| # | Hypothesis | Why it could cause ranking loss | Fix |
|---|------------|----------------------------------|-----|
| 1 | **Canonical fallback to request URL** | Many pages don’t pass canonical; Layout uses `Astro.url.href`. If Google or users hit www or trailing slash, canonical could point to the wrong variant. Split signals and “duplicate” content. | Add explicit canonical (same base URL, no trailing slash) to all indexable pages. |
| 2 | **Sitemap vs canonical URL shape** | Sitemap lists `.../blog/`, canonical on page is `.../blog`. Google sees two URLs for same content; can dilute strength or trigger duplicate content handling. | Use no trailing slash in custom sitemap to match canonical. |
| 3 | **Two sitemap systems** | Integration generates sitemap-index + sitemap-0 (with trailing slashes and admin/noindex pages). Even though robots points to custom sitemap, the other is discoverable. Inconsistent URL sets. | Remove @astrojs/sitemap; rely only on custom sitemap. |
| 4 | **Missing canonical on key pages** | About, get-started, legal, blog post, blog pagination rely on request URL as canonical. Same as #1. | Explicit canonical on all indexable pages. |
| 5 | **Host/redirect not in repo** | If www or http aren’t 301’d to https://gamelayer.io, multiple hostnames can be indexed. | Verify in Vercel/DNS: 301 http→https, 301 www→non-www (or chosen standard). |

---

## 9) Implemented Fixes (Summary)

- **Canonical:** Add explicit `canonical` to about, get-started, terms-of-service, privacy-policy, dpa, blog/[slug], blog/page/[page] using `https://gamelayer.io` + path (no trailing slash).
- **Sitemap:** (1) Remove trailing slashes from all `<loc>` in `sitemap.xml.ts`. (2) Add `/get-started`. (3) Remove `@astrojs/sitemap` from `astro.config.mjs` so only one sitemap exists.
- **Blog post:** Set canonical and schema `mainEntityOfPage`/URL to same non–trailing-slash URL.
- **No** changes to design, content, pricing, or functionality. No hreflang (none present).

---

## Files Changed (see commits)

- `astro.config.mjs` — remove sitemap integration
- `src/pages/sitemap.xml.ts` — no trailing slash; add get-started
- `src/pages/about.astro` — add canonical via buildSeo
- `src/pages/get-started.astro` — add canonical via buildSeo
- `src/pages/terms-of-service.astro` — add canonical
- `src/pages/privacy-policy.astro` — add canonical
- `src/pages/dpa.astro` — add canonical
- `src/pages/blog/[slug].astro` — add canonical; postUrl no trailing slash
- `src/pages/blog/page/[page].astro` — add canonical
- `README.md` — add “SEO sanity checklist” and GSC verification list

---

## Google Search Console — Verify After Deployment

1. **URL Inspection** for `https://gamelayer.io/`: confirm “URL is on Google” and view “Crawled page” — check &lt;title&gt;, meta description, and canonical.
2. **Sitemaps:** Open Sitemaps; ensure `https://gamelayer.io/sitemap.xml` is submitted and processed; no errors. After fix, sitemap-index.xml may disappear; that’s expected.
3. **Coverage / Indexing:** Check for “Duplicate without user-selected canonical” or “Crawled — currently not indexed” on key URLs; re-request indexing for homepage and main landing pages if needed.
4. **Settings → Crawl stats:** Confirm crawls are succeeding (no spike in 5xx).
5. **Manual check:** Open `https://gamelayer.io/sitemap.xml` and confirm all &lt;loc&gt; use **no trailing slash** and include get-started.
6. **Host:** If you use www or multiple domains, confirm in GSC only the preferred property (e.g. `https://gamelayer.io`) is used and 301s from www/http are in place on the host.

---

## Short checklist — what to verify in production (GSC + live site)

- [ ] **URL Inspection** (homepage): Canonical = `https://gamelayer.io/`, title/description correct.
- [ ] **Sitemaps:** `sitemap.xml` submitted and processed; no errors; `<loc>` URLs have no trailing slash.
- [ ] **Coverage:** No "Duplicate without user-selected canonical" for key URLs; fix or request indexing if needed.
- [ ] **Live sitemap:** Open `https://gamelayer.io/sitemap.xml` — all URLs use `https://gamelayer.io/...` (no trailing slash).
- [ ] **Redirects (Vercel/DNS):** `http://gamelayer.io` and `https://www.gamelayer.io` 301 to `https://gamelayer.io`.
