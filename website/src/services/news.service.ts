import { cache } from "react";

import { prisma } from "@/lib/prisma";
import type { NewsArticle } from "@/types/news";

/* =========================================
   TYPES
========================================= */

type CmsNewsResponse = {
  articles: NewsArticle[];
};

type CmsArticleResponse = {
  article: NewsArticle;
};

type NewsCacheEntry = {
  articles: NewsArticle[];
  expiresAt: number;
};

/* =========================================
   CONFIGURATION
========================================= */

/*
 * Keep a short memory cache so repeated page renders
 * do not continuously hit the CMS.
 *
 * Your Next.js pages already use ISR, so 5 minutes
 * is a reasonable starting point.
 */
const CACHE_DURATION_MS = 5 * 60 * 1000;

/*
 * Maximum amount of time we'll wait for the CMS
 * before falling back to the local database.
 */
const CMS_REQUEST_TIMEOUT_MS = 10 * 1000;

/* =========================================
   IN-MEMORY CACHE / REQUEST CONTROL
========================================= */

const newsCache = new Map<string, NewsCacheEntry>();

/*
 * Prevent multiple identical CMS requests from
 * running at the same time.
 */
const pendingRequests = new Map<string, Promise<NewsArticle[]>>();

/* =========================================
   CMS CONFIGURATION
========================================= */

function getCmsBaseUrl(): string {
  const baseUrl = process.env.NEWS_API_URL;

  if (!baseUrl) {
    throw new Error("NEWS_API_URL is missing");
  }

  return baseUrl.replace(/\/$/, "");
}

/* =========================================
   CACHE HELPERS
========================================= */

function getCachedArticles(cacheKey: string): NewsArticle[] | null {
  const entry = newsCache.get(cacheKey);

  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    /*
     * Remove expired entries instead of
     * leaving them in memory indefinitely.
     */
    newsCache.delete(cacheKey);

    return null;
  }

  return entry.articles;
}

function setCachedArticles(cacheKey: string, articles: NewsArticle[]) {
  newsCache.set(cacheKey, {
    articles,

    expiresAt: Date.now() + CACHE_DURATION_MS,
  });
}

/* =========================================
   DATABASE PERSISTENCE
========================================= */

/*
 * The customer-facing application keeps its
 * existing newsArticle table.
 *
 * Successful CMS responses are persisted here
 * so we still have news available if the CMS
 * temporarily becomes unavailable.
 */
async function persistArticles(
  articles: NewsArticle[],
  category?: string,
): Promise<NewsArticle[]> {
  if (articles.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    articles.map((article) =>
      prisma.newsArticle.upsert({
        where: {
          id: article.id,
        },

        update: {
          title: article.title,

          description: article.description ?? null,

          content: article.content ?? null,

          imageUrl: article.imageUrl ?? null,

          source: article.source,

          sourceUrl: article.sourceUrl ?? null,

          url: article.url,

          publishedAt: new Date(article.publishedAt),

          /*
           * Prefer the category supplied
           * directly by the CMS article.
           *
           * Fall back to the category from
           * the current request.
           */
          category: article.category ?? category ?? null,
        },

        create: {
          id: article.id,

          title: article.title,

          description: article.description ?? null,

          content: article.content ?? null,

          imageUrl: article.imageUrl ?? null,

          source: article.source,

          sourceUrl: article.sourceUrl ?? null,

          url: article.url,

          publishedAt: new Date(article.publishedAt),

          category: article.category ?? category ?? null,
        },
      }),
    ),
  );

  const persistedArticles: NewsArticle[] = [];

  results.forEach((result, index) => {
    const article = articles[index];

    if (result.status === "fulfilled") {
      persistedArticles.push(article);
    } else {
      console.warn(
        `Failed to persist news article [id: ${article.id}]:`,
        result.reason,
      );
    }
  });

  return persistedArticles;
}

/* =========================================
   SOURCE CLEAN-UP
========================================= */

/*
 * Some CMS articles carry their URL slug
 * (e.g. "gulf-stocks-qatar-saudi-split") in the
 * source field. Hide those instead of showing
 * them as the article's source.
 */
function cleanSource(source: string | null | undefined): string {
  const value = (source ?? "").trim();

  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(value)) {
    return "";
  }

  return value;
}

function cleanArticle(article: NewsArticle): NewsArticle {
  return {
    ...article,
    source: cleanSource(article.source),
  };
}

/* =========================================
   DATABASE CONVERSION
========================================= */

function databaseArticleToNewsArticle(article: {
  id: string;

  title: string;

  description: string | null;

  content: string | null;

  imageUrl: string | null;

  source: string;

  sourceUrl: string | null;

  url: string;

  publishedAt: Date;

  category: string | null;
}): NewsArticle {
  return {
    id: article.id,

    title: article.title,

    description: article.description ?? "",

    content: article.content ?? undefined,

    imageUrl: article.imageUrl,

    source: cleanSource(article.source),

    sourceUrl: article.sourceUrl ?? undefined,

    url: article.url,

    publishedAt: article.publishedAt.toISOString(),

    category: article.category ?? undefined,
  };
}

/* =========================================
   DATABASE FALLBACK
========================================= */

async function getDatabaseArticles(
  category: string,
  limit = 20,
): Promise<NewsArticle[]> {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: {
        category,
      },

      orderBy: {
        publishedAt: "desc",
      },

      take: limit,
    });

    return articles.map(databaseArticleToNewsArticle);
  } catch (error) {
    console.warn(`Unable to load ${category} articles from database:`, error);

    return [];
  }
}

/* =========================================
   CMS REQUEST
========================================= */

async function performCmsRequest(
  endpoint: string,
  category?: string,
): Promise<NewsArticle[]> {
  const baseUrl = getCmsBaseUrl();

  const url = `${baseUrl}${endpoint}`;

  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), CMS_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",

      signal: controller.signal,

      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(`CMS request failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as CmsNewsResponse;

    const articles = Array.isArray(data.articles) ? data.articles : [];

    /*
     * The CMS already returns NewsArticle,
     * so there is NO GNews normalization
     * required anymore.
     */
    if (articles.length > 0) {
      await persistArticles(articles, category);
    }

    return articles.map(cleanArticle);
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================
   SHARED FETCHER
========================================= */

async function fetchCmsNews(
  endpoint: string,
  category?: string,
): Promise<NewsArticle[]> {
  /*
   * The endpoint itself makes a good
   * cache key because it includes category,
   * search query, etc.
   */
  const cacheKey = endpoint;

  /*
   * 1. Fastest source:
   * short-lived memory cache.
   */
  const cached = getCachedArticles(cacheKey);

  if (cached) {
    return cached;
  }

  /*
   * 2. Reuse an identical CMS request
   * already in progress.
   */
  const pending = pendingRequests.get(cacheKey);

  if (pending) {
    return pending;
  }

  /*
   * 3. CMS is the source of truth.
   */
  const requestPromise = performCmsRequest(endpoint, category);

  pendingRequests.set(cacheKey, requestPromise);

  try {
    const articles = await requestPromise;

    /*
     * Cache even an empty response.
     *
     * This is important because an empty
     * response may mean that all articles
     * in a category were intentionally
     * removed/unpublished in the CMS.
     */
    setCachedArticles(cacheKey, articles);

    return articles;
  } catch (error) {
    console.warn(`CMS news request failed [${endpoint}]:`, error);

    /*
     * 4. CMS unavailable:
     * use persistent Next.js database as
     * fallback for category requests.
     */
    if (category) {
      const databaseArticles = await getDatabaseArticles(category, 20);

      if (databaseArticles.length > 0) {
        return databaseArticles;
      }
    }

    return [];
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

/* =========================================
   HOMEPAGE / BUSINESS
========================================= */

export async function getLatestBusinessNews(): Promise<NewsArticle[]> {
  return fetchCmsNews("/api/news?category=BUSINESS", "BUSINESS");
}

/* =========================================
   HOME PAGE TOP STORY
========================================= */

/*
 * The article chosen in the CMS as the Top Story,
 * or null if none is chosen (or the CMS is down).
 */
export async function getTopStory(): Promise<NewsArticle | null> {
  const [article] = await fetchCmsNews("/api/news/top-story");

  return article ?? null;
}

/* =========================================
   FINANCE
========================================= */

export async function getFinanceNews(): Promise<NewsArticle[]> {
  return fetchCmsNews("/api/news?category=FINANCE", "FINANCE");
}

/* =========================================
   ECONOMICS
========================================= */

export async function getEconomicsNews(): Promise<NewsArticle[]> {
  return fetchCmsNews("/api/news?category=ECONOMICS", "ECONOMICS");
}

/* =========================================
   TECHNOLOGY
========================================= */

export async function getTechNews(): Promise<NewsArticle[]> {
  return fetchCmsNews("/api/news?category=TECH", "TECH");
}

/* =========================================
   BANKING
========================================= */

export async function getBankingNews(): Promise<NewsArticle[]> {
  return fetchCmsNews("/api/news?category=BANKING", "BANKING");
}

/* =========================================
   PRIVATE MARKETS
========================================= */

export async function getPrivateMarketsNews(): Promise<NewsArticle[]> {
  return fetchCmsNews("/api/news?category=PRIVATE_MARKETS", "PRIVATE_MARKETS");
}

/* =========================================
   INVESTING
========================================= */

export async function getInvestingNews(): Promise<NewsArticle[]> {
  return fetchCmsNews("/api/news?category=INVESTING", "INVESTING");
}

/* =========================================
   CORPORATE FINANCE
========================================= */

export async function getCorporateFinanceNews(): Promise<NewsArticle[]> {
  return fetchCmsNews(
    "/api/news?category=CORPORATE_FINANCE",
    "CORPORATE_FINANCE",
  );
}

/* =========================================
   REAL ESTATE
========================================= */

export async function getRealEstateNews(): Promise<NewsArticle[]> {
  return fetchCmsNews("/api/news?category=REAL_ESTATE", "REAL_ESTATE");
}

/* =========================================
   WEALTH
========================================= */

export async function getWealthNews(): Promise<NewsArticle[]> {
  return fetchCmsNews("/api/news?category=WEALTH", "WEALTH");
}

/* =========================================
   SEARCH
========================================= */

export async function searchNews(userQuery: string): Promise<NewsArticle[]> {
  const query = encodeURIComponent(userQuery.trim());

  if (!query) {
    return [];
  }

  return fetchCmsNews(`/api/news/search?q=${query}`);
}

/* =========================================
   ARTICLE LOOKUP
========================================= */

async function fetchArticleById(
  articleId: string,
): Promise<NewsArticle | null> {
  const decodedId = decodeURIComponent(articleId);

  /*
   * Step 1:
   * Try the CMS first.
   *
   * This ensures edits made in the CMS
   * are reflected on the article page.
   */
  try {
    const baseUrl = getCmsBaseUrl();

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      CMS_REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(
        `${baseUrl}/api/news/${encodeURIComponent(decodedId)}`,
        {
          cache: "no-store",

          signal: controller.signal,

          headers: {
            Accept: "application/json",
          },
        },
      );

      /*
       * A CMS 404 means the article is no
       * longer published / no longer exists.
       *
       * Do not resurrect it from the local
       * database.
       */
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `CMS article request failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as CmsArticleResponse;

      if (data.article) {
        await persistArticles([data.article], data.article.category);

        return cleanArticle(data.article);
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.warn("CMS article lookup failed, trying local database:", error);
  }

  /*
   * Step 2:
   * CMS is unavailable, so use the local
   * persistent database as fallback.
   */
  try {
    const article = await prisma.newsArticle.findUnique({
      where: {
        id: decodedId,
      },
    });

    if (article) {
      return databaseArticleToNewsArticle(article);
    }
  } catch (error) {
    console.warn("Article DB fallback lookup failed:", error);
  }

  /*
   * Step 3:
   * Check memory cache as final fallback.
   */
  for (const entry of newsCache.values()) {
    const found = entry.articles.find((article) => article.id === decodedId);

    if (found) {
      return cleanArticle(found);
    }
  }

  return null;
}

/*
 * Cached per request, so the article page and its
 * share-preview metadata share one CMS lookup.
 */
export const getArticleById = cache(fetchArticleById);

/* =========================================
   INSTANT UPDATES FROM THE CMS
========================================= */

/*
 * Forget every article list kept in memory, so the next page render asks
 * the CMS again. Called by POST /api/revalidate when an editor publishes,
 * unpublishes, edits, deletes or changes the Top Story in the CMS.
 */
export function clearNewsCache() {
  newsCache.clear();
}
