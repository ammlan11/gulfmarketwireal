import type { NewsArticle } from "@/types/news";
import styles from "./TopicSection.module.scss";

type Props = {
  title: string;
  articles: NewsArticle[];
};

export default function TopicSection({
  title,
  articles,
}: Props) {
  if (!articles.length) return null;

  const lead = articles[0];
  const rest = articles.slice(1, 5);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <h2>{title}</h2>
        </div>

        <div className={styles.grid}>
          <article className={styles.lead}>
            {lead.imageUrl && (
              <a
                href={`/news/${encodeURIComponent(lead.id)}`}
              >
                <img
                  src={lead.imageUrl}
                  alt={lead.title}
                />
              </a>
            )}

            <span className={styles.source}>
              {lead.source}
            </span>

            <a
              href={`/news/${encodeURIComponent(lead.id)}`}
            >
              <h3>{lead.title}</h3>
            </a>

            {lead.description && (
              <p>{lead.description}</p>
            )}
          </article>

          <div className={styles.cards}>
            {rest.map((article) => (
              <article
                key={article.id}
                className={styles.card}
              >
                {article.imageUrl && (
                  <a
                    href={`/news/${encodeURIComponent(article.id)}`}
                  >
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                    />
                  </a>
                )}

                <span className={styles.source}>
                  {article.source}
                </span>

                <a
                  href={`/news/${encodeURIComponent(article.id)}`}
                >
                  <h3>{article.title}</h3>
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}