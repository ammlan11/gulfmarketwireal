import type { Metadata } from "next";

import Header from "@/components/layout/Header/Header";
import MarketTicker from "@/components/home/MarketTicker/MarketTicker";
import ArticlePage from "@/components/news/ArticlePage/ArticlePage";

import { getMarketQuotes } from "@/services/market-data.service";
import { getArticleById } from "@/services/news.service";

import { getCurrentUser } from "@/lib/auth";

import type { MarketQuote } from "@/types/market-quote";

import {
  SITE_NAME,
  articlePath,
  metaDescription,
} from "@/lib/site";

type Props = {
  params: Promise<{
    articleId: string;
  }>;
};

/*
 * Title, description and preview image for Google,
 * WhatsApp, LinkedIn, X and other link previews.
 */
export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { articleId } = await params;

  const article = await getArticleById(decodeURIComponent(articleId));

  if (!article) {
    return {
      title: "Article not found",
      robots: { index: false },
    };
  }

  const description = metaDescription(article.description);
  const path = articlePath(article.id);

  const images = article.imageUrl
    ? [{ url: article.imageUrl, alt: article.title }]
    : undefined;

  return {
    title: article.title,
    description,

    alternates: {
      canonical: path,
    },

    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      url: path,
      title: article.title,
      description,
      publishedTime: article.publishedAt,
      section: article.category,
      ...(images ? { images } : {}),
    },

    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      ...(images ? { images: images.map((image) => image.url) } : {}),
    },
  };
}

export default async function NewsArticlePage({
  params,
}: Props) {
  const { articleId } = await params;

  let quotes: MarketQuote[] = [];

  try {
    quotes = await getMarketQuotes();
  } catch {
    quotes = [];
  }

  // Check real logged-in user
  const user = await getCurrentUser();

  const article = await getArticleById(
    decodeURIComponent(articleId)
  );

  if (!article) {
    return (
      <>
        <Header marketQuotes={quotes} />

        <MarketTicker quotes={quotes} />

        <main
          style={{
            maxWidth: 1200,
            margin: "60px auto",
            padding: "0 24px",
          }}
        >
          <h1>Article not found</h1>
        </main>
      </>
    );
  }

  return (
    <>
      <Header marketQuotes={quotes} />

      <MarketTicker quotes={quotes} />

      <ArticlePage
        article={article}
        isAuthenticated={Boolean(user)}
      />
    </>
  );
}
