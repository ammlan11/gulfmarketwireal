import type { ReactNode } from "react";

import styles from "./LegalPage.module.scss";

type Props = {
  title: string;
  lastUpdated: string;
  intro: ReactNode;
  children: ReactNode;
};

export default function LegalPage({ title, lastUpdated, intro, children }: Props) {
  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <span className={styles.eyebrow}>LEGAL</span>

        <h1>{title}</h1>

        <p className={styles.updated}>Last updated: {lastUpdated}</p>

        <div className={styles.intro}>{intro}</div>

        <div className={styles.body}>{children}</div>
      </article>
    </main>
  );
}

/*
 * Shows the value, or a highlighted [placeholder] while it
 * hasn't been filled in yet in src/lib/legal.ts.
 */
export function LegalValue({ value, placeholder }: { value: string; placeholder: string }) {
  if (value.trim()) {
    return <>{value}</>;
  }

  return <mark className={styles.placeholder}>[{placeholder}]</mark>;
}

export function LegalEmail({ value }: { value: string }) {
  if (!value.trim()) {
    return <LegalValue value="" placeholder="contact email" />;
  }

  return <a href={`mailto:${value}`}>{value}</a>;
}

export function LegalTable({ children }: { children: ReactNode }) {
  return <div className={styles.tableWrap}>{children}</div>;
}
