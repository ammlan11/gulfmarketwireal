"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./RemoveSavedButton.module.scss";

type Props = {
  articleId: string;
};

export default function RemoveSavedButton({
  articleId,
}: Props) {
  const router = useRouter();

  const [removing, setRemoving] =
    useState(false);

  async function handleRemove() {
    if (removing) {
      return;
    }

    setRemoving(true);

    try {
      const response = await fetch(
        "/api/saved",
        {
          method: "DELETE",

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
            "Unable to remove saved article.",
        );
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Unable to remove saved article:",
        error,
      );

      setRemoving(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleRemove}
      disabled={removing}
    >
      {removing
        ? "Removing..."
        : "Remove"}
    </button>
  );
}