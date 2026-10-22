import Link from "next/link";

import type { NewsArticle } from "@/types/news";
import styles from "./EconomicsLanding.module.scss";

type Props = {
  articles: NewsArticle[];
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 60) {
    return `${Math.max(mins, 1)}m ago`;
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StoryCard({ article }: { article: NewsArticle }) {
  const articleUrl = `/news/${encodeURIComponent(article.id)}`;

  return (
    <article className={styles.storyCard}>
      {article.imageUrl && (
        <Link href={articleUrl}>
          <img src={article.imageUrl} alt={article.title} />
        </Link>
      )}

      <div className={styles.meta}>
        <span>{article.source}</span>
        <span>{timeAgo(article.publishedAt)}</span>
      </div>

      <Link href={articleUrl}>
        <h3>{article.title}</h3>
      </Link>

      {article.description && <p>{article.description}</p>}
    </article>
  );
}

export default function EconomicsLanding({ articles }: Props) {
  if (!articles.length) {
    return null;
  }

  /*
   * Main layout
   */
  const lead = articles[0];
  const secondary = articles.slice(1, 5);

  /*
   * Economics sections
   */
  const inflation = articles.slice(1, 5);
  const centralBanks = articles.slice(2, 6);
  const globalEconomy = articles.slice(3, 7);
  const trade = articles.slice(4, 8);

  const moreEconomics = articles.slice(0, 10);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* =====================================
            PAGE HEADER
        ====================================== */}

        <header className={styles.pageHeader}>
          <h1>Economics</h1>

          <nav>
            {inflation.length > 0 && <a href="#inflation">Inflation</a>}

            {centralBanks.length > 0 && (
              <a href="#central-banks">Central Banks</a>
            )}

            {globalEconomy.length > 0 && (
              <a href="#global-economy">Global Economy</a>
            )}

            {trade.length > 0 && <a href="#trade">Trade</a>}

            {moreEconomics.length > 0 && <a href="#more">More</a>}
          </nav>
        </header>

        {/* =====================================
            TOP STORIES
        ====================================== */}

        <section className={styles.topGrid}>
          {/* LEAD STORY */}

          <article className={styles.leadStory}>
            {lead.imageUrl && (
              <Link href={`/news/${encodeURIComponent(lead.id)}`}>
                <img src={lead.imageUrl} alt={lead.title} />
              </Link>
            )}

            <div className={styles.meta}>
              <span>{lead.source}</span>

              <span>{timeAgo(lead.publishedAt)}</span>
            </div>

            <Link href={`/news/${encodeURIComponent(lead.id)}`}>
              <h2>{lead.title}</h2>
            </Link>

            {lead.description && <p>{lead.description}</p>}
          </article>

          {/* SECONDARY STORIES */}

          {secondary.length > 0 && (
            <div className={styles.secondary}>
              {secondary.map((article) => (
                <StoryCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* =====================================
            INFLATION
        ====================================== */}

        {inflation.length > 0 && (
          <section className={styles.newsSection} id="inflation">
            <h2>Inflation</h2>

            <div className={styles.cardGrid}>
              {inflation.map((article) => (
                <StoryCard key={`inflation-${article.id}`} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* =====================================
            CENTRAL BANKS
        ====================================== */}

        {centralBanks.length > 0 && (
          <section className={styles.newsSection} id="central-banks">
            <h2>Central Banks</h2>

            <div className={styles.cardGrid}>
              {centralBanks.map((article) => (
                <StoryCard key={`central-${article.id}`} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* =====================================
            GLOBAL ECONOMY
        ====================================== */}

        {globalEconomy.length > 0 && (
          <section className={styles.newsSection} id="global-economy">
            <h2>Global Economy</h2>

            <div className={styles.cardGrid}>
              {globalEconomy.map((article) => (
                <StoryCard key={`global-${article.id}`} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* =====================================
            TRADE
        ====================================== */}

        {trade.length > 0 && (
          <section className={styles.newsSection} id="trade">
            <h2>Trade</h2>

            <div className={styles.cardGrid}>
              {trade.map((article) => (
                <StoryCard key={`trade-${article.id}`} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* =====================================
            MORE FROM ECONOMICS
        ====================================== */}

        {moreEconomics.length > 0 && (
          <section className={styles.moreSection} id="more">
            <h2>More from Economics</h2>

            {moreEconomics.map((article) => (
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
                    <img src={article.imageUrl} alt={article.title} />
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
