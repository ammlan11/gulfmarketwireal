import type { NewsArticle } from "@/types/news";
import styles from "./OpinionSection.module.scss";

type Props = {
  articles: NewsArticle[];
};

export default function OpinionSection({
  articles,
}: Props) {
  if (!articles.length) return null;

  const lead = articles[0];
  const rest = articles.slice(1, 4);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <h2>Opinion & Analysis</h2>
        </div>

        <div className={styles.layout}>
          <article className={styles.lead}>
            {lead.imageUrl && (
              <img
                src={lead.imageUrl}
                alt={lead.title}
              />
            )}

            <div>
              <span>{lead.source}</span>

              <a
                href={`/news/${encodeURIComponent(lead.id)}`}
              >
                <h3>{lead.title}</h3>
              </a>

              {lead.description && (
                <p>{lead.description}</p>
              )}
            </div>
          </article>

          <div className={styles.list}>
            {rest.map((article) => (
              <article key={article.id}>
                <span>{article.source}</span>

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