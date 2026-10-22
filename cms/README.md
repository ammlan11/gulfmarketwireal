# Ammlan Writes

Standalone Node.js/TypeScript news CMS and read-only REST API designed to replace the GNews upstream used by the existing Sumar application.

## Stack
- Node.js + TypeScript + Express
- Prisma ORM + MySQL
- EJS server-rendered admin dashboard
- Cookie-based admin session
- Zod validation

## News contract
Public API articles use these fields exactly:
`id`, `title`, `description`, `content`, `imageUrl`, `source`, `sourceUrl`, `url`, `publishedAt`, `category`.

IDs are SHA-256 hashes of the canonical `url`, matching the existing application.

## Categories
`BUSINESS`, `FINANCE`, `ECONOMICS`, `TECH`, `BANKING`, `PRIVATE_MARKETS`, `INVESTING`, `CORPORATE_FINANCE`, `REAL_ESTATE`, `WEALTH`.

## Install
1. Install Node.js 20+ and MySQL 8+.
2. Create a database, e.g. `sumar_news`.
3. Copy `.env.example` to `.env` and set the MySQL URL, session secret and admin credentials.
4. Run:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open `http://localhost:4000/login`.

## Production
Set `NODE_ENV=production`, use HTTPS, set a long random `SESSION_SECRET`, and place the app behind your preferred reverse proxy/process manager.

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

## Admin routes
- `GET /login`
- `GET /admin/news`
- `GET /admin/news/new`
- `POST /admin/news`
- `GET /admin/news/:id`
- `GET /admin/news/:id/edit`
- `POST /admin/news/:id`
- `POST /admin/news/:id/delete`

## Public API
### List latest published news
`GET /api/news`

Optional query parameters: `category`, `q`, `limit` (max 100), `offset`.

Example: `/api/news?category=FINANCE&limit=20`

Response:
```json
{
  "articles": [
    {
      "id": "64-character-sha256-id",
      "title": "Article title",
      "description": "Summary",
      "content": "Full content",
      "imageUrl": "https://example.com/image.jpg",
      "source": "Sumar",
      "sourceUrl": "https://example.com",
      "url": "https://example.com/article",
      "publishedAt": "2026-10-07T10:30:00.000Z",
      "category": "FINANCE"
    }
  ]
}
```

### Search
`GET /api/news/search?q=markets`

### Single article
`GET /api/news/:id`

## Connecting the existing application
The current site can replace its GNews request layer with a small fetcher:

```ts
async function fetchHostedNews(category: string): Promise<NewsArticle[]> {
  const baseUrl = process.env.NEWS_API_URL;
  if (!baseUrl) throw new Error("NEWS_API_URL is missing");

  const response = await fetch(
    `${baseUrl}/api/news?category=${encodeURIComponent(category)}&limit=20`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`News API returned ${response.status}`);
  }

  const data = await response.json() as { articles: NewsArticle[] };
  return data.articles ?? [];
}
```

Then preserve your existing exported functions, for example:

```ts
export async function getFinanceNews() {
  return fetchHostedNews("FINANCE");
}

export async function getTechNews() {
  return fetchHostedNews("TECH");
}
```

This keeps page/component imports unchanged.

## Security note
This starter uses one administrator account configured through environment variables. For a multi-user editorial team, replace it with a database-backed User model, password hashing, roles, CSRF protection and audit logging.

## Automated news ingest

`POST /api/ingest/news` lets the automated "Economy news desk" task add articles. It is switched off unless `INGEST_API_KEY` is set.

Environment variables (CMS server):

- `INGEST_API_KEY`: shared secret, at least 32 characters. The task sends it as `Authorization: Bearer <key>`.
- `PEXELS_API_KEY`: free key from https://www.pexels.com/api/ used to find article photos.

Request body (JSON): `title`, `content` (Markdown is converted to plain paragraphs), `source` (publisher names), `url` (main source URL; must be unique), `category` (a CMS category, or `World Economy` → ECONOMICS, `Middle East Economy` → BUSINESS, `Dollar & Gold` → FINANCE), and either `imageQuery` (Pexels search) or `imageUrl` (images.pexels.com or images.unsplash.com only). Optional: `description`, `sourceUrl`, `publishedAt` (ISO with offset), `status` (`DRAFT` default, or `PUBLISHED`), `imageCredit`.

Responses: `201` created (returns `editUrl`), `400` invalid data, `401` bad key, `409` story already exists, `422` no usable photo, `503` ingest disabled.

Photos are saved in `public/uploads/news/`; Pexels photos are named `pexels-<id>-…` so the same photo is not reused, and a "Photo: <name> / Pexels" credit is added to the end of the article.
