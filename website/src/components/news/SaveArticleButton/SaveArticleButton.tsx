"use client";

import { useEffect, useState } from "react";

import styles from "./SaveArticleButton.module.scss";

type Props = {
  articleId: string;
};

type SavedArticleResponse = {
  success: boolean;
  savedArticles?: Array<{
    articleId: string;
  }>;
};

export default function SaveArticleButton({
  articleId,
}: Props) {
  const [isSaved, setIsSaved] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /*
   * Check whether this article is already
   * saved when the component loads.
   */
  useEffect(() => {
    let cancelled = false;

    async function checkSavedStatus() {
      try {
        const response = await fetch(
          "/api/saved",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return;
        }

        const data: SavedArticleResponse =
          await response.json();

        if (cancelled) {
          return;
        }

        const saved =
          data.savedArticles?.some(
            (item) =>
              item.articleId === articleId,
          ) ?? false;

        setIsSaved(saved);
      } catch (error) {
        console.error(
          "Unable to check saved article:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkSavedStatus();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  async function handleSaveToggle() {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/saved",
        {
          method: isSaved
            ? "DELETE"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            articleId,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.message ??
            "Unable to update saved article.",
        );
      }

      setIsSaved((current) => !current);
    } catch (error) {
      console.error(
        "Unable to update saved article:",
        error,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${
        isSaved ? styles.saved : ""
      }`}
      onClick={handleSaveToggle}
      disabled={loading || saving}
      aria-pressed={isSaved}
    >
      <span
        className={styles.icon}
        aria-hidden="true"
      >
        {isSaved ? "★" : "☆"}
      </span>

      <span>
        {loading
          ? "Loading..."
          : saving
            ? "Saving..."
            : isSaved
              ? "Saved"
              : "Save"}
      </span>
    </button>
  );
}