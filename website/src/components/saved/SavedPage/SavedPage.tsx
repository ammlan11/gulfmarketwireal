import Link from "next/link";

import type { NewsArticle } from "@/types/news";
import RemoveSavedButton from "@/components/saved/RemoveSavedButton/RemoveSavedButton";

import styles from "./SavedPage.module.scss";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Props = {
  user: User;
  articles: NewsArticle[];
};

export default function SavedPage({
  user,
  articles,
}: Props) {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <div>
            <span className={styles.eyebrow}>
              YOUR NEWS
            </span>

            <h1>Saved</h1>

            <p>
              Stories you save will appear here so you can
              return to them later.
            </p>
          </div>

          <div className={styles.user}>
            {user.name}
          </div>
        </div>

        {articles.length === 0 ? (
          <section className={styles.emptyState}>
            <div className={styles.bookmarkIcon}>
              ☆
            </div>

            <h2>No saved stories yet</h2>

            <p>
              Save stories from G M W and they’ll be
              collected here for easy access.
            </p>

            <Link
              href="/"
              className={styles.browseButton}
            >
              Browse News
            </Link>
          </section>
        ) : (
          <section className={styles.savedSection}>
            <div className={styles.savedHeader}>
              <span>
                {articles.length}{" "}
                {articles.length === 1
                  ? "SAVED STORY"
                  : "SAVED STORIES"}
              </span>
            </div>

            <div className={styles.grid}>
              {articles.map((article) => (
                <article
                  key={article.id}
                  className={styles.card}
                >
                  <Link
                    href={`/news/${encodeURIComponent(
                      article.id,
                    )}`}
                    className={styles.imageLink}
                  >
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className={styles.image}
                      />
                    ) : (
                      <div
                        className={
                          styles.imagePlaceholder
                        }
                      >
                        G M W
                      </div>
                    )}
                  </Link>

                  <div className={styles.cardContent}>
                    <div className={styles.cardMeta}>
                      <span className={styles.category}>
                        {article.category ?? "NEWS"}
                      </span>

                      <span className={styles.date}>
                        {new Date(
                          article.publishedAt,
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>

                    <h2>
                      <Link
                        href={`/news/${encodeURIComponent(
                          article.id,
                        )}`}
                      >
                        {article.title}
                      </Link>
                    </h2>

                    {article.description && (
                      <p className={styles.description}>
                        {article.description}
                      </p>
                    )}

                   <div className={styles.cardFooter}>
  <span className={styles.source}>
    {article.source}
  </span>

  <div className={styles.cardActions}>
    <RemoveSavedButton
      articleId={article.id}
    />

    <Link
      href={`/news/${encodeURIComponent(
        article.id,
      )}`}
      className={styles.readLink}
    >
      Read Story →
    </Link>
  </div>
</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}