import styles from "./loading.module.scss";

export default function Loading() {
  return (
    <div className={styles.loadingPage}>
      <div className={styles.loader}>
        <div className={styles.brand}>
          GULF MARKET WIRE
        </div>

        <div className={styles.spinner} />

        <p>Loading...</p>
      </div>
    </div>
  );
}