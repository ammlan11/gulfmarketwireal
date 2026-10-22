import Link from "next/link";

import type { NewsArticle } from "@/types/news";
import styles from "./FinanceLanding.module.scss";

type Props = {
  articles: NewsArticle[];
  bankingArticles?: NewsArticle[];
  privateMarketsArticles?: NewsArticle[];
  investingArticles?: NewsArticle[];
  corporateFinanceArticles?: NewsArticle[];
  realEstateArticles?: NewsArticle[];
  wealthArticles?: NewsArticle[];
};

function ArticleImage({ article }: { article: NewsArticle }) {
  if (!article.imageUrl) {
    return <div className={styles.imageFallback}>G M W</div>;
  }

  return <img src={article.imageUrl} alt={article.title} loading="lazy" />;
}

function StoryCard({ article }: { article: NewsArticle }) {
  const articleUrl = `/news/${encodeURIComponent(article.id)}`;

  return (
    <article className={styles.storyCard}>
      <Link href={articleUrl}>
        <ArticleImage article={article} />

        <h3>{article.title}</h3>
      </Link>

      <span className={styles.source}>{article.source}</span>
    </article>
  );
}

function FinanceSection({
  title,
  articles,
}: {
  title: string;
  articles: NewsArticle[];
}) {
  if (!articles.length) {
    return null;
  }

  return (
    <section className={styles.newsSection}>
      <div className={styles.sectionHeading}>
        <h2>{title}</h2>

        <a href="#more-finance">More {title} →</a>
      </div>

      <div className={styles.cardGrid}>
        {articles.slice(0, 4).map((article) => (
          <StoryCard key={`${title}-${article.id}`} article={article} />
        ))}
      </div>
    </section>
  );
}

export default function FinanceLanding({
  articles,
  bankingArticles = [],
  privateMarketsArticles = [],
  investingArticles = [],
  corporateFinanceArticles = [],
  realEstateArticles = [],
  wealthArticles = [],
}: Props) {
  /*
   * Render nothing when there are no
   * Finance articles.
   */
  if (!articles.length) {
    return null;
  }

  /*
   * Top stories
   */
  const lead = articles[0];
  const secondary = articles[1];

  /*
   * Category content
   *
   * Prefer dedicated CMS category data.
   * Fall back to Finance articles when
   * dedicated data isn't available.
   */
  const banking =
    bankingArticles.length > 0 ? bankingArticles : articles.slice(2, 6);

  const privateMarkets =
    privateMarketsArticles.length > 0
      ? privateMarketsArticles
      : articles.slice(6, 10);

  const investing =
    investingArticles.length > 0 ? investingArticles : articles.slice(10, 14);

  const corporateFinance =
    corporateFinanceArticles.length > 0
      ? corporateFinanceArticles
      : articles.slice(14, 18);

  const realEstate =
    realEstateArticles.length > 0 ? realEstateArticles : articles.slice(18, 22);

  const wealth =
    wealthArticles.length > 0 ? wealthArticles : articles.slice(22, 26);

  /*
   * Feature stories
   */
  const featureImageArticle = articles[8];

  const featureTextArticle = articles[9];

  /*
   * More Finance
   */
  const moreFinance = articles.slice(0, 12);

  const hasFeatures = Boolean(featureImageArticle || featureTextArticle);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* =================================
            PAGE HEADER
        ================================= */}

        <header className={styles.pageHeader}>
          <h1>Finance</h1>

          <nav>
            {banking.length > 0 && <a href="#banking">Banking</a>}

            {privateMarkets.length > 0 && (
              <a href="#private-markets">Private Markets</a>
            )}

            {investing.length > 0 && <a href="#investing">Investing</a>}

            {corporateFinance.length > 0 && (
              <a href="#corporate-finance">Corporate Finance</a>
            )}

            {realEstate.length > 0 && (
              <a href="#real-estate">Real Estate Markets</a>
            )}

            {wealth.length > 0 && <a href="#wealth">Wealth</a>}
          </nav>
        </header>

        {/* =================================
            TOP STORIES
        ================================= */}

        <section
          className={`${styles.topArea} ${secondary ? "" : styles.singleLead}`}
        >
          {/* MAIN LEAD */}

          <article className={styles.mainLead}>
            <Link href={`/news/${encodeURIComponent(lead.id)}`}>
              <ArticleImage article={lead} />

              <h2>{lead.title}</h2>
            </Link>

            {lead.description && <p>{lead.description}</p>}

            <span>{lead.source}</span>
          </article>

          {/* SECOND LEAD */}

          {secondary && (
            <article className={styles.secondLead}>
              <Link href={`/news/${encodeURIComponent(secondary.id)}`}>
                <ArticleImage article={secondary} />

                <h2>{secondary.title}</h2>
              </Link>

              {secondary.description && <p>{secondary.description}</p>}

              <span>{secondary.source}</span>
            </article>
          )}
        </section>

        {/* =================================
            FEATURES
        ================================= */}

        {hasFeatures && (
          <section className={styles.featureSection}>
            <h2>Features</h2>

            <div className={styles.featureLayout}>
              {featureImageArticle && (
                <StoryCard article={featureImageArticle} />
              )}

              {featureTextArticle && (
                <div className={styles.featureText}>
                  <span>Finance Feature</span>

                  <h2>{featureTextArticle.title}</h2>

                  {featureTextArticle.description && (
                    <p>{featureTextArticle.description}</p>
                  )}

                  <Link
                    href={`/news/${encodeURIComponent(featureTextArticle.id)}`}
                  >
                    Read full story →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =================================
            BANKING
        ================================= */}

        {banking.length > 0 && (
          <div id="banking">
            <FinanceSection title="Banking" articles={banking} />
          </div>
        )}

        {/* =================================
            PRIVATE MARKETS
        ================================= */}

        {privateMarkets.length > 0 && (
          <div id="private-markets">
            <FinanceSection title="Private Markets" articles={privateMarkets} />
          </div>
        )}

        {/* =================================
            INVESTING
        ================================= */}

        {investing.length > 0 && (
          <div id="investing">
            <FinanceSection title="Investing" articles={investing} />
          </div>
        )}

        {/* =================================
            CORPORATE FINANCE
        ================================= */}

        {corporateFinance.length > 0 && (
          <div id="corporate-finance">
            <FinanceSection
              title="Corporate Finance"
              articles={corporateFinance}
            />
          </div>
        )}

        {/* =================================
            REAL ESTATE
        ================================= */}

        {realEstate.length > 0 && (
          <div id="real-estate">
            <FinanceSection title="Real Estate Markets" articles={realEstate} />
          </div>
        )}

        {/* =================================
            WEALTH
        ================================= */}

        {wealth.length > 0 && (
          <div id="wealth">
            <FinanceSection title="Wealth" articles={wealth} />
          </div>
        )}

        {/* =================================
            MORE FROM FINANCE
        ================================= */}

        {moreFinance.length > 0 && (
          <section className={styles.moreFinance} id="more-finance">
            <h2>More from Finance</h2>

            {moreFinance.map((article) => (
              <article key={`more-${article.id}`}>
                <div>
                  <span>{article.source}</span>

                  <Link href={`/news/${encodeURIComponent(article.id)}`}>
                    <h3>{article.title}</h3>
                  </Link>

                  {article.description && <p>{article.description}</p>}
                </div>

                {article.imageUrl && (
                  <Link href={`/news/${encodeURIComponent(article.id)}`}>
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      loading="lazy"
                    />
                  </Link>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
