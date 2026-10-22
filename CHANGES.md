# Changes: October 2026

This file lists every change made to the website and CMS this month, grouped by feature, with the files involved. Code comments in each file explain the details. The files are named after what they do (`lead-magnet`, `leads`, `market-hours`, `ingest`, `image.service`, …).

The starting point was the team's `znrsolutions/news_platform` repo and the CMS as delivered. To see the exact line changes, diff `website/` against that repo.

---

## Website (`website/`)

### 1. Removed the sign-in wall
Every page and full article is now free to read. The footer shows for everyone. Login and register still work but are optional.

- `src/app/layout.tsx`: removed `AuthGate`, footer always shown, popup added, tab title "Gulf Market Wire"
- `src/app/{markets,finance,economics,tech,live-tv}/page.tsx`: removed `AuthGate` wrappers
- `src/app/news/[articleId]/page.tsx`: full article sent to every visitor
- `src/components/news/ArticlePage/ArticlePage.tsx` and `.module.scss`: registration overlay removed
- **Deleted:** `src/components/auth/AuthGate/` (no longer used)

### 2. Free-guide popup (lead capture)
A panel slides out 3 seconds after a visitor arrives (or at 50% scroll), with a blurred background, offering the "Tips for Investing in GCC Markets" PDF in exchange for name and email (phone and "Do you trade?" are optional). A "Free guide" button stays in the bottom-right corner.

- `src/lib/lead-magnet.ts`: **all popup settings**: title, text, bullets, PDF path, cover image, timing, pages to hide it on
- `src/components/lead-magnet/LeadMagnetPopup/`: the popup and button
- `src/app/api/leads/route.ts`: saves a sign-up (validation, spam trap, rate limit, no duplicates per email+guide)
- `prisma/schema.prisma` → model `Lead`; migration `20261016120000_add_leads`
- `public/downloads/gcc-investing-guide.pdf`: the guide; `public/images/gcc-guide-cover.jpg`: its cover preview
- Closing the popup hides it for the rest of that visit (`sessionStorage`); signing up hides it for good (`localStorage`).

### 3. Admin leads panel
`/admin/leads`, for ADMIN accounts only (USER accounts get a 404). Tabs: **New** (under 24h), **Old** (over 24h), **Extracted** (already exported). "Export to Excel" downloads an `.xlsx` and moves those leads to Extracted.

- `src/app/admin/leads/page.tsx`: page, with role check on the server
- `src/app/admin/page.tsx`: `/admin` → `/admin/leads`
- `src/components/admin/LeadsPanel/`: tabs, table, selection, export buttons
- `src/app/api/admin/leads/export/route.ts`: builds the Excel file (`exceljs`), marks leads extracted
- `src/lib/leads-config.ts`: tab names, 24h window, time zone (Asia/Colombo), page size
- `src/lib/leads.ts`: server-only helpers (tab queries, admin check)
- `src/components/layout/UserMenu/UserMenu.tsx`: "Admin: Leads" link for admins
- migration `20261016130000_add_lead_extracted_at`; `package.json`: added `exceljs`

### 4. Home-page Top Story (works with CMS change 2)
- `src/services/news.service.ts` → `getTopStory()`
- `src/app/page.tsx`: the chosen Top Story leads the home page, otherwise the newest article does
- `src/types/news.ts` → `isTopStory`

### 5. Article "source" slugs hidden
Some CMS articles had their URL slug (e.g. `gulf-stocks-qatar-saudi-split`) in the source field.
- `src/services/news.service.ts` → `cleanSource()` / `cleanArticle()`

### 6. Keep readers on the site
Markets, AI Race, Global Economy, Opinion and Live TV cards used to open the original publisher's site. They now open our own article page.
- `src/components/home/TopicSection/TopicSection.tsx`, `OpinionSection.tsx`, `src/components/live-tv/LiveTVLanding/LiveTVLanding.tsx`

### 7. SEO and link previews
- `src/lib/site.ts`: site name, URL (`NEXT_PUBLIC_SITE_URL`), default description and share image
- `src/app/layout.tsx`: default title template, Open Graph and Twitter tags
- `src/app/news/[articleId]/page.tsx` → `generateMetadata()`: per-article title, description, image
- section pages: own titles and canonical URLs
- `src/app/sitemap.ts` (`/sitemap.xml`) and `src/app/robots.ts` (`/robots.txt`, hides admin/account/login pages)
- `public/og-default.png`: branded share image

### 8. Privacy Policy and Terms of Use
- `src/app/privacy/page.tsx` (with a `#cookies` section), `src/app/terms/page.tsx`
- `src/lib/legal.ts`: **company name, address, contact email, governing law** (Gulf Market Wire, Business Bay Dubai, info@gulfmarketwire.com, UAE)
- `src/components/legal/LegalPage/`: shared page layout
- Footer links, popup fine print and register page now link to them (`Footer.tsx`, `LeadMagnetPopup.tsx`, `src/app/register/page.tsx`)
- Have a lawyer review the text before launch.

### 9. Ticker: closing prices when markets are shut
Same chip design. A closed market's chip is muted, shows its last session price, and has a "CLOSE" tag.
- `src/lib/market-hours.ts`: trading hours per instrument type (US stocks incl. NYSE holidays, forex, commodities, crypto). **Update the holiday list each year.**
- `src/services/market-data.service.ts`: applies the hours, remembers each instrument's last open price, hides a fake "0.00% everywhere" feed
- `src/components/home/MarketTicker/`: the CLOSE tag and muted style
- `prisma/schema.prisma` → model `MarketClose`; migration `20261022130000_add_market_close`
- `src/types/market-quote.ts` → `marketOpen`

### 10. Small fixes
- `src/app/register/page.tsx`: country list built with `useMemo` (fixes the lint error that failed CI); "G M W" → "Gulf Market Wire"
- `src/app/admin/leads/page.tsx`: page title

---

## CMS (`cms/`)

### 1. Automated news ingest (used by the scheduled task)
`POST /api/ingest/news`, protected by `INGEST_API_KEY`. Saves an article as a **DRAFT** with a free Pexels photo and a photographer credit. Full details are in `cms/README.md`.
- `src/controllers/ingest.controller.ts`: key check, validation, section mapping (World Economy → ECONOMICS, Middle East Economy → BUSINESS, Dollar & Gold → FINANCE), Markdown → plain paragraphs, duplicate check (409)
- `src/services/image.service.ts`: Pexels search (skips photos already used), safe download (Pexels/Unsplash hosts only, 15 MB max)
- `src/config/env.ts`: `INGEST_API_KEY`, `PEXELS_API_KEY`
- `src/routes/api.routes.ts`: the route

### 2. Top Story checkbox
"Make this the Top Story on the home page" on the add/edit form. Only one article at a time.
- `prisma/schema.prisma` → `isTopStory`; migration `20261019090000_add_top_story`
- `src/services/news.service.ts`: clears the previous Top Story; `getPublishedTopStory()`
- `src/controllers/api.controller.ts` + `src/routes/api.routes.ts` → `GET /api/news/top-story`
- `src/controllers/admin.controller.ts`: saves the checkbox, shows the current Top Story
- `views/news/form.ejs`, `index.ejs`, `view.ejs`, `public/css/admin.css`: checkbox and "Top story" badge

### 3. One-click Publish / Move to draft
Green **Publish** button on drafts and **Move to draft** on published articles, on the dashboard and the article page.
- `src/controllers/admin.controller.ts` → `changeStatus()`; route `POST /admin/news/:id/status` in `src/routes/admin.routes.ts`
- `views/news/index.ejs`, `views/news/view.ejs`, `public/css/admin.css`

### 4. Small fixes
- `src/types/express-ejs-layouts.d.ts`: missing type definition (fixes `npm run build`)
- `.env.example` added; `.gitignore` ignores `public/uploads/` (photos live on the server)

---

## Repository
- `.github/workflows/ci.yml`: CI for both projects (website: lint and build; CMS: build). It lived in `website/.github/`, where GitHub ignores it.
- `website/.env.example`, `cms/.env.example`: settings templates (no real values)

## Database migrations to run on deploy
| Project | Migration | Adds |
| --- | --- | --- |
| website | `20261016120000_add_leads` | `Lead` table |
| website | `20261016130000_add_lead_extracted_at` | `Lead.extractedAt` |
| website | `20261022130000_add_market_close` | `MarketClose` table |
| cms | `20261019090000_add_top_story` | `NewsArticle.isTopStory` |

All are additive. Run `npx prisma migrate deploy` in each folder.

## Tested (dry run, 22 Oct 2026)
On a fresh MariaDB with every migration applied, using the scheduled task's real posting script:
- 3 articles ingested as drafts, each with a different photo and a credit, in the right sections; a failed photo search retried automatically; re-running skipped all 3 as duplicates
- drafts hidden from the website; one-click Publish made them appear; Move to draft removed them; unauthenticated and off-site redirect attempts refused
- Top Story set in the CMS led the home page; article page showed the full text, photo, credit and share tags
- popup sign-up saved a lead and served the PDF; admin panel showed it; Excel export downloaded and moved it to Extracted
- both projects pass lint, type-check and production build

## Known issues (not caused by these changes)
- **Website migration table-name case:** the first migration creates `User` but later ones alter `user`. They only apply on MySQL with `lower_case_table_names=1`, so keep that setting. Don't edit migrations already applied.
- **Lint warnings** (24, no errors): mostly `<img>` vs `next/image` and unused variables in older files.
- `website/docker-compose.yml` contains development-only database passwords. Don't reuse them in production.
