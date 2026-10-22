import Link from "next/link";

import type { NewsArticle } from "@/types/news";
import styles from "./TechLanding.module.scss";

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
          <img src={article.imageUrl} alt={article.title} loading="lazy" />
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

export default function TechLanding({ articles }: Props) {
  /*
   * Don't show an unavailable message.
   */
  if (!articles.length) {
    return null;
  }

  /*
   * Top stories
   */
  const lead = articles[0];
  const secondary = articles.slice(1, 5);

  /*
   * Tech sections
   */
  const ai = articles.slice(1, 5);
  const companies = articles.slice(3, 7);
  const chips = articles.slice(5, 9);
  const startups = articles.slice(2, 6);

  /*
   * More Tech
   */
  const moreTech = articles.slice(0, 10);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* =================================
            PAGE HEADER
        ================================= */}

        <header className={styles.pageHeader}>
          <h1>Tech</h1>

          <nav>
            {ai.length > 0 && <a href="#ai">AI</a>}

            {companies.length > 0 && <a href="#companies">Big Tech</a>}

            {chips.length > 0 && <a href="#chips">Semiconductors</a>}

            {startups.length > 0 && <a href="#startups">Startups</a>}

            {moreTech.length > 0 && <a href="#more-tech">More</a>}
          </nav>
        </header>

        {/* =================================
            TOP STORIES
        ================================= */}

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

        {/* =================================
            ARTIFICIAL INTELLIGENCE
        ================================= */}

        {ai.length > 0 && (
          <section className={styles.newsSection} id="ai">
            <h2>Artificial Intelligence</h2>

            <div className={styles.cardGrid}>
              {ai.map((article) => (
                <StoryCard key={`ai-${article.id}`} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* =================================
            BIG TECH
        ================================= */}

        {companies.length > 0 && (
          <section className={styles.newsSection} id="companies">
            <h2>Big Tech</h2>

            <div className={styles.cardGrid}>
              {companies.map((article) => (
                <StoryCard key={`companies-${article.id}`} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* =================================
            SEMICONDUCTORS
        ================================= */}

        {chips.length > 0 && (
          <section className={styles.newsSection} id="chips">
            <h2>Semiconductors</h2>

            <div className={styles.cardGrid}>
              {chips.map((article) => (
                <StoryCard key={`chips-${article.id}`} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* =================================
            STARTUPS
        ================================= */}

        {startups.length > 0 && (
          <section className={styles.newsSection} id="startups">
            <h2>Startups</h2>

            <div className={styles.cardGrid}>
              {startups.map((article) => (
                <StoryCard key={`startups-${article.id}`} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* =================================
            MORE FROM TECH
        ================================= */}

        {moreTech.length > 0 && (
          <section className={styles.moreSection} id="more-tech">
            <h2>More from Tech</h2>

            {moreTech.map((article) => (
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
