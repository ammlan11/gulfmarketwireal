import { Request, Response } from "express";

import { prisma } from "../config/prisma";
import { getRouteParam } from "../utils/request";

import {
  getPublishedTopStory,
  listPublishedArticles,
  publicArticle,
} from "../services/news.service";

/* =========================================
   LIST NEWS
========================================= */

export async function getNews(req: Request, res: Response) {
  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;

  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const articles = await listPublishedArticles(category, q, limit, offset);

  return res.json({
    articles: articles.map(publicArticle),
  });
}

/* =========================================
   TOP STORY
========================================= */

/*
 * Returns the home-page Top Story in the same
 * { articles: [...] } shape as the list endpoint.
 * Empty when none is chosen (the website then
 * falls back to the newest article).
 */
export async function getTopStory(_req: Request, res: Response) {
  const article = await getPublishedTopStory();

  return res.json({
    articles: article ? [publicArticle(article)] : [],
  });
}

/* =========================================
   SEARCH NEWS
========================================= */

export async function searchNews(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!q) {
    return res.status(400).json({
      error: "Query parameter q is required.",
    });
  }

  const articles = await listPublishedArticles(undefined, q, 50, 0);

  return res.json({
    articles: articles.map(publicArticle),
  });
}

/* =========================================
   GET NEWS BY ID
========================================= */

export async function getNewsById(req: Request, res: Response) {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({
      error: "Article ID is required.",
    });
  }

  const article = await prisma.newsArticle.findFirst({
    where: {
      id,
      status: "PUBLISHED",
    },
  });

  if (!article) {
    return res.status(404).json({
      error: "Article not found.",
    });
  }

  return res.json({
    article: publicArticle(article),
  });
}
