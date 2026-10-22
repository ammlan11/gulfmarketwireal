import Link from "next/link";
import type { NewsArticle } from "@/types/news";
import { formatTimeAgo } from "@/lib/time";
import styles from "./HeroNewsGrid.module.scss";

type HeroNewsGridProps = {
  articles: NewsArticle[];
};

function getArticleHref(article: NewsArticle) {
  return `/news/${encodeURIComponent(article.id)}`;
}

export default function HeroNewsGrid({
  articles,
}: HeroNewsGridProps) {
  if (!articles.length) {
    return (
      <section className={styles.empty}>
        No news available right now.
      </section>
    );
  }

  const lead = articles[0];
  const secondary = articles.slice(1, 4);
  const latest = articles.slice(4, 10);

  return (
    <section className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.mainGrid}>

          {/* =========================
              LEFT STORY IMAGE
          ========================= */}
          <article className={styles.visualStory}>
            {lead.imageUrl ? (
              <Link
                href={getArticleHref(lead)}
                className={styles.imageLink}
              >
                <img
                  src={lead.imageUrl}
                  alt={lead.title}
                  className={styles.heroImage}
                />
              </Link>
            ) : (
              <Link
                href={getArticleHref(lead)}
                className={styles.imageLink}
              >
                <div className={styles.imageFallback}>
                  <span>MARKETS</span>

                  <div className={styles.chart}>
                    <svg viewBox="0 0 500 200">
                      <polyline
                        points="
                          0,160
                          35,150
                          70,170
                          105,135
                          140,145
                          175,110
                          210,120
                          245,95
                          280,105
                          315,70
                          350,82
                          385,50
                          420,65
                          455,30
                          500,40
                        "
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            )}

            <div className={styles.storyMeta}>
              <span>{lead.source}</span>

              <span>
                {formatTimeAgo(lead.publishedAt)}
              </span>
            </div>
          </article>

          {/* =========================
              MAIN HEADLINE
          ========================= */}
          <div className={styles.leadColumn}>
            <span className={styles.eyebrow}>
              TOP STORY
            </span>

            <Link
              href={getArticleHref(lead)}
              className={styles.leadLink}
            >
              <h1>{lead.title}</h1>
            </Link>

            {lead.description && (
              <p className={styles.description}>
                {lead.description}
              </p>
            )}

            <div className={styles.divider} />

            {/* SECONDARY STORIES */}
            {secondary.map((article) => (
              <article
                key={article.id}
                className={styles.secondaryStory}
              >
                <div>
                  <span
                    className={styles.secondarySource}
                  >
                    {article.source}
                  </span>

                  <Link
                    href={getArticleHref(article)}
                  >
                    <h2>{article.title}</h2>
                  </Link>
                </div>

                <span className={styles.time}>
                  {formatTimeAgo(article.publishedAt)}
                </span>
              </article>
            ))}
          </div>

          {/* =========================
              RIGHT LATEST
          ========================= */}
          <aside className={styles.latest}>
            <div className={styles.latestHeader}>
              <h2>Latest</h2>

              <span
                className={styles.liveIndicator}
              >
                LIVE
              </span>
            </div>

            <div className={styles.latestList}>
              {latest.map((article) => (
                <article
                  key={article.id}
                  className={styles.latestItem}
                >
                  <span className={styles.time}>
                    {formatTimeAgo(
                      article.publishedAt
                    )}
                  </span>

                  <Link
                    href={getArticleHref(article)}
                  >
                    <h3>{article.title}</h3>
                  </Link>

                  <span className={styles.source}>
                    {article.source}
                  </span>
                </article>
              ))}
            </div>
          </aside>

        </div>
      </div>
    </section>
  );
}