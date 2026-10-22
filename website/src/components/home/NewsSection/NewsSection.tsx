import Link from "next/link";

import type { NewsArticle } from "@/types/news";
import styles from "./NewsSection.module.scss";

type NewsSectionProps = {
  title: string;
  articles: NewsArticle[];
};

function getArticleHref(article: NewsArticle): string {
  return `/news/${encodeURIComponent(article.id)}`;
}

function getSectionHref(title: string): string {
  const routes: Record<string, string> = {
    Finance: "/finance",
    Economics: "/economics",
    Tech: "/tech",
    Technology: "/tech",
    Business: "/business",
    Banking: "/banking",
    Investing: "/investing",
    Wealth: "/wealth",
    "Real Estate": "/real-estate",
    "Private Markets": "/private-markets",
    "Corporate Finance": "/corporate-finance",
  };

  return routes[title] ?? "/";
}

function formatTime(date: string): string {
  const published = new Date(date);

  if (Number.isNaN(published.getTime())) {
    return "";
  }

  const now = new Date();

  const diffMinutes = Math.max(
    0,
    Math.floor((now.getTime() - published.getTime()) / 1000 / 60),
  );

  if (diffMinutes < 60) {
    return `${Math.max(diffMinutes, 1)}m ago`;
  }

  const hours = Math.floor(diffMinutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return published.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function NewsSection({ title, articles }: NewsSectionProps) {
  if (!articles.length) {
    return null;
  }

  const lead = articles[0];
  const sideArticles = articles.slice(1, 4);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* =========================
            SECTION HEADING
        ========================= */}

        <div className={styles.headingRow}>
          <h2 style={{ display: "none" }}>{title}</h2>

          <Link href={getSectionHref(title)} className={styles.viewAll}>
            View All
          </Link>
        </div>

        {/* =========================
            NEWS GRID
        ========================= */}

        <div className={styles.grid}>
          {/* =========================
              LEAD STORY
          ========================= */}

          <article className={styles.leadStory}>
            {lead.imageUrl && (
              <Link href={getArticleHref(lead)} className={styles.imageLink}>
                <img
                  src={lead.imageUrl}
                  alt={lead.title}
                  className={styles.leadImage}
                />
              </Link>
            )}

            <div className={styles.meta}>
              <span>{lead.source}</span>

              <span>{formatTime(lead.publishedAt)}</span>
            </div>

            <Link href={getArticleHref(lead)} className={styles.titleLink}>
              <h3>{lead.title}</h3>
            </Link>

            {lead.description && (
              <p className={styles.description}>{lead.description}</p>
            )}
          </article>

          {/* =========================
              SIDE STORIES
          ========================= */}

          <div className={styles.storyList}>
            {sideArticles.map((article) => (
              <article key={article.id} className={styles.storyItem}>
                <div className={styles.storyContent}>
                  {/* ARTICLE METADATA */}

                  <div className={styles.meta}>
                    <span>{article.source}</span>

                    <span>{formatTime(article.publishedAt)}</span>
                  </div>

                  {/* INTERNAL ARTICLE LINK */}

                  <Link
                    href={getArticleHref(article)}
                    className={styles.titleLink}
                  >
                    <h3>{article.title}</h3>
                  </Link>

                  {/* ARTICLE DESCRIPTION */}

                  {article.description && <p>{article.description}</p>}
                </div>

                {/* ARTICLE IMAGE */}

                {article.imageUrl && (
                  <Link href={getArticleHref(article)}>
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className={styles.storyImage}
                    />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
