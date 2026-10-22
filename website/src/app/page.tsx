import type { Metadata } from "next";

import Header from "@/components/layout/Header/Header";
import MarketTicker from "@/components/home/MarketTicker/MarketTicker";
import HeroNewsGrid from "@/components/home/HeroNewsGrid/HeroNewsGrid";
import NewsSection from "@/components/home/NewsSection/NewsSection";
import TopicSection from "@/components/home/TopicSection/TopicSection";
import OpinionSection from "@/components/home/OpinionSection/OpinionSection";

import {
  getTopStory,
  getLatestBusinessNews,
  getFinanceNews,
  getEconomicsNews,
  getTechNews,
} from "@/services/news.service";

import { getMarketQuotes } from "@/services/market-data.service";

import type { MarketQuote } from "@/types/market-quote";
import type { NewsArticle } from "@/types/news";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

// Cache this page for 5 minutes on the server (ISR).
// Every user within the 5-min window gets instant cached HTML —
// no DB or GNews queries run on their request.
export const revalidate = 300;

export default async function Home() {
  /*
   * Market data and the four news feeds are
   * independent, so load them concurrently.
   *
   * allSettled prevents one unavailable provider
   * from breaking the entire homepage.
   */
  const [
    marketResult,
    businessResult,
    financeResult,
    economicsResult,
    techResult,
    topStoryResult,
  ] = await Promise.allSettled([
    getMarketQuotes(),
    getLatestBusinessNews(),
    getFinanceNews(),
    getEconomicsNews(),
    getTechNews(),
    getTopStory(),
  ]);

  const marketQuotes: MarketQuote[] =
    marketResult.status === "fulfilled" ? marketResult.value : [];

  const latestBusiness: NewsArticle[] =
    businessResult.status === "fulfilled" ? businessResult.value : [];

  /*
   * The Top Story chosen in the CMS leads the page.
   * If none is chosen, the newest business story does.
   */
  const topStory =
    topStoryResult.status === "fulfilled" ? topStoryResult.value : null;

  const businessArticles: NewsArticle[] = topStory
    ? [
        topStory,
        ...latestBusiness.filter((article) => article.id !== topStory.id),
      ]
    : latestBusiness;

  const financeArticles: NewsArticle[] =
    financeResult.status === "fulfilled" ? financeResult.value : [];

  const economicsArticles: NewsArticle[] =
    economicsResult.status === "fulfilled" ? economicsResult.value : [];

  const techArticles: NewsArticle[] =
    techResult.status === "fulfilled" ? techResult.value : [];

  if (marketResult.status === "rejected") {
    console.warn("Market data unavailable on homepage:", marketResult.reason);
  }

  if (businessResult.status === "rejected") {
    console.warn("Business news unavailable:", businessResult.reason);
  }

  if (financeResult.status === "rejected") {
    console.warn("Finance news unavailable:", financeResult.reason);
  }

  if (economicsResult.status === "rejected") {
    console.warn("Economics news unavailable:", economicsResult.reason);
  }

  if (techResult.status === "rejected") {
    console.warn("Tech news unavailable:", techResult.reason);
  }

  return (
    <>
      <Header marketQuotes={marketQuotes} />

      <MarketTicker quotes={marketQuotes} />

      <main>
        {businessArticles.length > 0 && (
          <HeroNewsGrid articles={businessArticles} />
        )}

        {businessArticles.length > 1 && (
          <TopicSection
            title="Markets"
            articles={businessArticles.slice(1, 7)}
          />
        )}

        {financeArticles.length > 0 && (
          <NewsSection title="Finance" articles={financeArticles} />
        )}

        {economicsArticles.length > 0 && (
          <NewsSection title="Economics" articles={economicsArticles} />
        )}

        {techArticles.length > 0 && (
          <NewsSection title="Tech" articles={techArticles} />
        )}

        {techArticles.length > 1 && (
          <TopicSection
            title="The AI Race"
            articles={techArticles.slice(1, 7)}
          />
        )}

        {businessArticles.length > 2 && (
          <OpinionSection articles={businessArticles.slice(2, 8)} />
        )}

        {economicsArticles.length > 1 && (
          <TopicSection
            title="Global Economy"
            articles={economicsArticles.slice(1, 7)}
          />
        )}

        {businessArticles.length > 3 && (
          <TopicSection
            title="More Top Stories"
            articles={businessArticles.slice(3, 9)}
          />
        )}
      </main>
    </>
  );
}
