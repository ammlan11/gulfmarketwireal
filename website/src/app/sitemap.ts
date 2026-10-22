import type { MetadataRoute } from "next";

import {
  getEconomicsNews,
  getFinanceNews,
  getLatestBusinessNews,
  getTechNews,
} from "@/services/news.service";
import { SITE_URL, articlePath } from "@/lib/site";
import type { NewsArticle } from "@/types/news";

// Rebuild the sitemap at most every 10 minutes.
export const revalidate = 600;

const SECTIONS = ["markets", "finance", "economics", "tech", "live-tv"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...SECTIONS.map((section) => ({
      url: `${SITE_URL}/${section}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  /*
   * Latest articles from each section. A failing section is
   * skipped so the sitemap always loads.
   */
  const results = await Promise.allSettled([
    getLatestBusinessNews(),
    getFinanceNews(),
    getEconomicsNews(),
    getTechNews(),
  ]);

  const seen = new Set<string>();
  const articles: NewsArticle[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;

    for (const article of result.value) {
      if (!seen.has(article.id)) {
        seen.add(article.id);
        articles.push(article);
      }
    }
  }

  return [
    ...pages,
    ...articles.map((article) => ({
      url: `${SITE_URL}${articlePath(article.id)}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
