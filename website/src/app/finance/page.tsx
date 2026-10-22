import type { Metadata } from "next";

import Header from "@/components/layout/Header/Header";
import MarketTicker from "@/components/home/MarketTicker/MarketTicker";
import FinanceLanding from "@/components/finance/FinanceLanding/FinanceLanding";

import {
  getFinanceNews,
  getBankingNews,
  getPrivateMarketsNews,
  getInvestingNews,
  getCorporateFinanceNews,
  getRealEstateNews,
  getWealthNews,
} from "@/services/news.service";

import { getMarketQuotes } from "@/services/market-data.service";

import type { MarketQuote } from "@/types/market-quote";
import type { NewsArticle } from "@/types/news";

// Authentication is evaluated per request.
// News data is already cached by news.service.ts.

export const metadata: Metadata = {
  title: "Finance",
  description:
    "Banking, investing, private markets, corporate finance, real estate and wealth news from the Gulf and beyond.",
  alternates: {
    canonical: "/finance",
  },
};

export default async function FinancePage() {
  const [
    quotesResult,
    financeResult,
    bankingResult,
    privateMarketsResult,
    investingResult,
    corporateFinanceResult,
    realEstateResult,
    wealthResult,
  ] = await Promise.allSettled([
    getMarketQuotes(),
    getFinanceNews(),
    getBankingNews(),
    getPrivateMarketsNews(),
    getInvestingNews(),
    getCorporateFinanceNews(),
    getRealEstateNews(),
    getWealthNews(),
  ]);

  // =========================
  // MARKET QUOTES
  // =========================

  const quotes: MarketQuote[] =
    quotesResult.status === "fulfilled" ? quotesResult.value : [];

  // =========================
  // FINANCE NEWS
  // =========================

  const articles: NewsArticle[] =
    financeResult.status === "fulfilled" ? financeResult.value : [];

  const banking: NewsArticle[] =
    bankingResult.status === "fulfilled" ? bankingResult.value : [];

  const privateMarkets: NewsArticle[] =
    privateMarketsResult.status === "fulfilled"
      ? privateMarketsResult.value
      : [];

  const investing: NewsArticle[] =
    investingResult.status === "fulfilled" ? investingResult.value : [];

  const corporateFinance: NewsArticle[] =
    corporateFinanceResult.status === "fulfilled"
      ? corporateFinanceResult.value
      : [];

  const realEstate: NewsArticle[] =
    realEstateResult.status === "fulfilled" ? realEstateResult.value : [];

  const wealth: NewsArticle[] =
    wealthResult.status === "fulfilled" ? wealthResult.value : [];

  // =========================
  // PAGE
  // =========================

  return (
    <>
      <Header marketQuotes={quotes} />

      <MarketTicker quotes={quotes} />

      <FinanceLanding
        articles={articles}
        bankingArticles={banking}
        privateMarketsArticles={privateMarkets}
        investingArticles={investing}
        corporateFinanceArticles={corporateFinance}
        realEstateArticles={realEstate}
        wealthArticles={wealth}
      />
    </>
  );
}
