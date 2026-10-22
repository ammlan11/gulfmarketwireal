# Gulf Market Wire

Source code for **gulfmarketwire.com** and its news CMS.

| Folder | What it is | Stack | Runs on |
| --- | --- | --- | --- |
| [`website/`](website) | The public news website (readers, accounts, free-guide popup, admin leads panel) | Next.js 16, React 19, Prisma, MySQL | port 3000 |
| [`cms/`](cms) | "Ammlan Writes", the CMS where articles are written, approved and published | Express, EJS, Prisma, MySQL | port 4000 (cms.gulfmarketwire.com) |

The website reads all articles from the CMS's public API (`NEWS_API_URL`). Each project has its own database.

**What changed recently, and why:** see [CHANGES.md](CHANGES.md).

## How news gets onto the site

```
Claude scheduled task "Economy news desk" (7:59am and 5:59pm Colombo)
   → researches and writes 7 articles
   → POST cms.gulfmarketwire.com/api/ingest/news   (secret key)
        → CMS finds a free Pexels photo, saves the article as a DRAFT
   → editor clicks "Publish" on the CMS dashboard
   → website shows it (within about 5 minutes, due to caching)
```

## Run locally

Both projects need Node.js 20+ and MySQL 8 (or MariaDB) with case-insensitive table names (`lower_case_table_names=1`; see CHANGES.md, "Known issues").

**CMS**

```bash
cd cms
cp .env.example .env        # then fill in the values (see cms/README.md)
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev                 # http://localhost:4000/login
```

**Website**

```bash
cd website
# create .env with:
#   DATABASE_URL="mysql://USER:PASS@localhost:3306/DB"
#   NEWS_API_URL="http://localhost:4000"      (or https://cms.gulfmarketwire.com)
#   MARKET_API_BASE_URL="https://<ticker api>" (optional locally)
#   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev                 # http://localhost:3000
```

## Deploy checklist

1. **Both projects:** `npm install`, then `npx prisma migrate deploy` (adds new tables and columns, and doesn't touch existing data).
2. **CMS server settings:** `INGEST_API_KEY` (shared with the scheduled task) and `PEXELS_API_KEY` (free from pexels.com/api).
3. **Website server settings:** `NEXT_PUBLIC_SITE_URL=https://gulfmarketwire.com` and `MARKET_API_BASE_URL` (ticker API).
4. Make at least one admin: `UPDATE User SET role='ADMIN' WHERE email='…';` in the website database.
