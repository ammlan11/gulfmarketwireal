import type { Metadata } from "next";

import Header from "@/components/layout/Header/Header";
import MarketTicker from "@/components/home/MarketTicker/MarketTicker";
import TechLanding from "@/components/tech/TechLanding/TechLanding";

import { getTechNews } from "@/services/news.service";
import { getMarketQuotes } from "@/services/market-data.service";

import type { MarketQuote } from "@/types/market-quote";
import type { NewsArticle } from "@/types/news";

// Authentication is checked on each request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tech",
  description:
    "Technology and AI news shaping markets, business and the Gulf economy.",
  alternates: {
    canonical: "/tech",
  },
};

export default async function TechPage() {
  const [quotesResult, articlesResult] = await Promise.allSettled([
    getMarketQuotes(),
    getTechNews(),
  ]);

  // =========================
  // MARKET QUOTES
  // =========================

  const quotes: MarketQuote[] =
    quotesResult.status === "fulfilled" ? quotesResult.value : [];

  // =========================
  // TECH NEWS
  // =========================

  const articles: NewsArticle[] =
    articlesResult.status === "fulfilled" ? articlesResult.value : [];

  // =========================
  // ERROR LOGGING
  // =========================

  if (quotesResult.status === "rejected") {
    console.warn("Unable to load market quotes:", quotesResult.reason);
  }

  if (articlesResult.status === "rejected") {
    console.error("Unable to load Tech news:", articlesResult.reason);
  }

  // =========================
  // PAGE
  // =========================

  return (
    <>
      <Header marketQuotes={quotes} />

      <MarketTicker quotes={quotes} />

      <TechLanding articles={articles} />
    </>
  );
}
