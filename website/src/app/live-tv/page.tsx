import type { Metadata } from "next";

import Header from "@/components/layout/Header/Header";
import MarketTicker from "@/components/home/MarketTicker/MarketTicker";
import LiveTVLanding from "@/components/live-tv/LiveTVLanding/LiveTVLanding";

import { getLatestBusinessNews } from "@/services/news.service";
import { getMarketQuotes } from "@/services/market-data.service";

import type { NewsArticle } from "@/types/news";
import type { MarketQuote } from "@/types/market-quote";

// Authentication is evaluated per request.
// News data is cached separately by news.service.ts.

export const metadata: Metadata = {
  title: "Live TV",
  description:
    "Watch live business and markets TV alongside the latest headlines.",
  alternates: {
    canonical: "/live-tv",
  },
};

export default async function LiveTVPage() {
  const [quotesResult, articlesResult] = await Promise.allSettled([
    getMarketQuotes(),
    getLatestBusinessNews(),
  ]);

  // =========================
  // MARKET QUOTES
  // =========================

  const quotes: MarketQuote[] =
    quotesResult.status === "fulfilled" ? quotesResult.value : [];

  // =========================
  // BUSINESS NEWS
  // =========================

  const articles: NewsArticle[] =
    articlesResult.status === "fulfilled" ? articlesResult.value : [];

  // =========================
  // PAGE
  // =========================

  return (
    <>
      <Header marketQuotes={quotes} />

      <MarketTicker quotes={quotes} />

      <LiveTVLanding articles={articles} />
    </>
  );
}
