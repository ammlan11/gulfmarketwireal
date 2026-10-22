import type { Metadata } from "next";

import Header from "@/components/layout/Header/Header";
import MarketTicker from "@/components/home/MarketTicker/MarketTicker";
import EconomicsLanding from "@/components/economics/EconomicsLanding/EconomicsLanding";

import { getEconomicsNews } from "@/services/news.service";
import { getMarketQuotes } from "@/services/market-data.service";

import type { MarketQuote } from "@/types/market-quote";
import type { NewsArticle } from "@/types/news";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Economics",
  description:
    "GCC and global economy news: growth, inflation, oil, central banks and government policy.",
  alternates: {
    canonical: "/economics",
  },
};

export default async function EconomicsPage() {
  const [quotesResult, articlesResult] =
    await Promise.allSettled([
      getMarketQuotes(),
      getEconomicsNews(),
    ]);

  const quotes: MarketQuote[] =
    quotesResult.status === "fulfilled"
      ? quotesResult.value
      : [];

  const articles: NewsArticle[] =
    articlesResult.status === "fulfilled"
      ? articlesResult.value
      : [];

  return (
    <>
      <Header marketQuotes={quotes} />

      <MarketTicker quotes={quotes} />

      <EconomicsLanding articles={articles} />
    </>
  );
}