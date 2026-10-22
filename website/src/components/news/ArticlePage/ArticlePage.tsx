import type { NewsArticle } from "@/types/news";

import styles from "./ArticlePage.module.scss";

import SaveArticleButton from "@/components/news/SaveArticleButton/SaveArticleButton";

type Props = {
  article: NewsArticle;
  isAuthenticated: boolean;
};

export default function ArticlePage({ article, isAuthenticated }: Props) {
  const hasFullContent = Boolean(article.content?.trim());

  const paragraphs = hasFullContent
    ? article
        .content!.split(/\n\s*\n|\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  const publishedDate = new Date(article.publishedAt);

  const formattedDate = Number.isNaN(publishedDate.getTime())
    ? ""
    : publishedDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

  return (
    <main className={styles.page}>
      <article className={styles.article}>
        {/* =========================
            ARTICLE CATEGORY
        ========================= */}

        <div className={styles.category}>{article.category ?? "NEWS"}</div>

        {/* =========================
            ARTICLE TITLE
        ========================= */}

        <h1>{article.title}</h1>

        {/* =========================
            ARTICLE METADATA
        ========================= */}

        <div className={styles.meta}>
          <span>{article.source}</span>

          {formattedDate && <span>{formattedDate}</span>}
        </div>

        {/* =========================
            SAVE ARTICLE
        ========================= */}

        {isAuthenticated && <SaveArticleButton articleId={article.id} />}

        {/* =========================
            FEATURED IMAGE
        ========================= */}

        {article.imageUrl && (
          <img
            className={styles.heroImage}
            src={article.imageUrl}
            alt={article.title}
            loading="eager"
          />
        )}

        {/* =========================
            ARTICLE DESCRIPTION
        ========================= */}

        {article.description && (
          <p className={styles.intro}>{article.description}</p>
        )}

        {/* =========================
            ARTICLE BODY
        ========================= */}

        <div className={styles.fullContent}>
          <div className={styles.articleBody}>
            {hasFullContent ? (
              paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <>
                <p>
                  The full article is not yet available on Gulf Market Wire.
                </p>

                <p>
                  Our editorial team is working to provide additional coverage
                  and updates for this story.
                </p>

                <p>Please check back later for more information.</p>
              </>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
