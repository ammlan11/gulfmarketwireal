import { NewsStatus, Prisma } from "@prisma/client";

import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { generateArticleId } from "../utils/article-id";

/* =========================================
   NEWS CATEGORIES
========================================= */

export const NEWS_CATEGORIES = [
  "BUSINESS",
  "FINANCE",
  "ECONOMICS",
  "TECH",
  "BANKING",
  "PRIVATE_MARKETS",
  "INVESTING",
  "CORPORATE_FINANCE",
  "REAL_ESTATE",
  "WEALTH",
] as const;

/* =========================================
   TYPES
========================================= */

export type NewsInput = {
  title: string;

  description?: string | null;

  content?: string | null;

  /*
   * Stored internally as:
   *
   * /uploads/news/example.webp
   *
   * The publicArticle() function converts this
   * into a complete URL for API consumers.
   */
  imageUrl?: string | null;

  source: string;

  sourceUrl?: string | null;

  url: string;

  publishedAt: Date;

  category?: string | null;

  status: NewsStatus;

  isTopStory: boolean;
};

/* =========================================
   PUBLIC ARTICLE FORMAT
========================================= */

/**
 * Converts a database NewsArticle into the
 * public NewsArticle contract consumed by the
 * main application.
 *
 * Uploaded images are stored in the database as:
 *
 * /uploads/news/example.webp
 *
 * but returned through the API as:
 *
 * https://news.example.com/uploads/news/example.webp
 */
export function publicArticle(article: any) {
  const baseUrl = env.PUBLIC_BASE_URL.replace(/\/$/, "");

  let imageUrl: string | null = article.imageUrl ?? null;

  /*
   * Only prepend PUBLIC_BASE_URL when the image
   * is stored as a relative local path.
   *
   * This also means an existing absolute image
   * URL would continue working.
   */
  if (imageUrl && imageUrl.startsWith("/")) {
    imageUrl = `${baseUrl}${imageUrl}`;
  }

  return {
    id: article.id,

    title: article.title,

    description: article.description ?? "",

    content: article.content ?? undefined,

    imageUrl,

    source: article.source,

    sourceUrl: article.sourceUrl ?? undefined,

    url: article.url,

    publishedAt: article.publishedAt.toISOString(),

    category: article.category ?? undefined,

    isTopStory: Boolean(article.isTopStory),
  };
}

/* =========================================
   TOP STORY
========================================= */

/**
 * The published article currently chosen as
 * the website's home-page Top Story, if any.
 */
export async function getPublishedTopStory() {
  return prisma.newsArticle.findFirst({
    where: {
      isTopStory: true,
      status: NewsStatus.PUBLISHED,
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
}

/**
 * Only one article can be the Top Story.
 * Clears the flag on every other article.
 */
async function clearOtherTopStories(
  tx: Prisma.TransactionClient,
  keepId?: string,
) {
  await tx.newsArticle.updateMany({
    where: {
      isTopStory: true,
      ...(keepId ? { id: { not: keepId } } : {}),
    },

    data: {
      isTopStory: false,
    },
  });
}

/* =========================================
   ADMIN ARTICLE LIST
========================================= */

export async function listAdminArticles(
  q?: string,
  category?: string,
  status?: NewsStatus,
) {
  const where: Prisma.NewsArticleWhereInput = {};

  /*
   * Category filter
   */
  if (category) {
    where.category = category;
  }

  /*
   * Status filter
   */
  if (status) {
    where.status = status;
  }

  /*
   * Search
   */
  if (q) {
    where.OR = [
      {
        title: {
          contains: q,
        },
      },

      {
        description: {
          contains: q,
        },
      },

      {
        source: {
          contains: q,
        },
      },

      {
        content: {
          contains: q,
        },
      },
    ];
  }

  return prisma.newsArticle.findMany({
    where,

    orderBy: {
      publishedAt: "desc",
    },
  });
}

/* =========================================
   PUBLIC ARTICLE LIST
========================================= */

export async function listPublishedArticles(
  category?: string,
  q?: string,
  limit = 20,
  offset = 0,
) {
  const where: Prisma.NewsArticleWhereInput = {
    status: NewsStatus.PUBLISHED,
  };

  /*
   * Category filter
   */
  if (category) {
    where.category = category;
  }

  /*
   * Search
   */
  if (q) {
    where.OR = [
      {
        title: {
          contains: q,
        },
      },

      {
        description: {
          contains: q,
        },
      },

      {
        content: {
          contains: q,
        },
      },
    ];
  }

  return prisma.newsArticle.findMany({
    where,

    orderBy: {
      publishedAt: "desc",
    },

    take: limit,

    skip: offset,
  });
}

/* =========================================
   CREATE ARTICLE
========================================= */

export async function createArticle(input: NewsInput) {
  /*
   * Keep the same deterministic article-ID
   * strategy used by the consuming application.
   *
   * Same canonical URL = same SHA-256 ID.
   */
  const id = generateArticleId(input.url);

  return prisma.$transaction(async (tx) => {
    if (input.isTopStory) {
      await clearOtherTopStories(tx);
    }

    return tx.newsArticle.create({
      data: {
        id,

        ...input,
      },
    });
  });
}

/* =========================================
   UPDATE ARTICLE
========================================= */

export async function updateArticle(id: string, input: NewsInput) {
  const existing = await prisma.newsArticle.findUniqueOrThrow({
    where: {
      id,
    },
  });

  /*
   * The article ID is based on its canonical URL.
   *
   * If the URL hasn't changed, keep the same ID.
   *
   * If the URL changes, generate a new ID.
   */
  const nextId = existing.url === input.url ? id : generateArticleId(input.url);

  /*
   * Normal update.
   *
   * URL hasn't changed, therefore the article ID
   * doesn't need to change.
   */
  if (nextId === id) {
    return prisma.$transaction(async (tx) => {
      if (input.isTopStory) {
        await clearOtherTopStories(tx, id);
      }

      return tx.newsArticle.update({
        where: {
          id,
        },

        data: input,
      });
    });
  }

  /*
   * Canonical URL changed.
   *
   * Because the article ID is derived from the URL,
   * create the article using its new deterministic
   * ID and remove the old record atomically.
   */
  return prisma.$transaction(async (tx) => {
    if (input.isTopStory) {
      await clearOtherTopStories(tx, id);
    }

    const created = await tx.newsArticle.create({
      data: {
        id: nextId,

        ...input,
      },
    });

    await tx.newsArticle.delete({
      where: {
        id,
      },
    });

    return created;
  });
}
