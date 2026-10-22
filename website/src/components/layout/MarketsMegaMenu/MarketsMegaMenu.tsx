import Link from "next/link";

import type { MarketQuote } from "@/types/market-quote";

import styles from "./MarketsMegaMenu.module.scss";

const newsLinks = [
  "Deals",
  "Fixed Income",
  "ETFs",
  "FX",
  "Economic Calendar",
  "Private Markets",
];

const dataLinks = [
  "Stocks",
  "Futures",
  "Rates & Bonds",
  "Currencies",
  "Commodities",
  "Sectors",
  "Energy",
];

type Props = {
  marketQuotes?: MarketQuote[];
};

export default function MarketsMegaMenu({
  marketQuotes = [],
}: Props) {
  return (
    <div className={styles.menu}>
      <div className={styles.column}>
        <div className={styles.heading}>
          News
        </div>

        {newsLinks.map((item) => (
          <Link
            href="/markets"
            key={item}
            className={styles.link}
          >
            {item}
          </Link>
        ))}
      </div>

      <div className={styles.column}>
        <div className={styles.heading}>
          Data
        </div>

        {dataLinks.map((item) => (
          <Link
            href="/markets"
            key={item}
            className={styles.link}
          >
            {item}
          </Link>
        ))}
      </div>

      <div className={styles.securitiesSection}>
        <div className={styles.heading}>
          Top Securities
        </div>

        {marketQuotes.length > 0 ? (
          <div className={styles.securityGrid}>
            {marketQuotes.map((quote) => {
              const positive =
                quote.direction === "up";

              const negative =
                quote.direction === "down";

              return (
                <Link
                  href="/markets"
                  key={quote.id}
                  className={styles.securityCard}
                >
                  <div
                    className={
                      styles.securityName
                    }
                  >
                    {quote.symbol}
                  </div>

                  <div
                    className={
                      styles.securityValue
                    }
                  >
                    {quote.price !== null
                      ? quote.price.toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 4,
                          },
                        )
                      : "—"}
                  </div>

                  <div
                    className={
                      positive
                        ? styles.positive
                        : negative
                          ? styles.negative
                          : styles.neutral
                    }
                  >
                    {positive
                      ? "▲"
                      : negative
                        ? "▼"
                        : "•"}{" "}
                    {quote.changePercent !== null
                      ? `${Math.abs(
                          quote.changePercent,
                        ).toFixed(2)}%`
                      : "—"}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div
            className={
              styles.marketUnavailable
            }
          >
            Market data is temporarily
            unavailable.
          </div>
        )}
      </div>

      <div className={styles.watchlist}>
        <p>
          Track your portfolio from
          <br />
          anywhere with a
          <br />
          personal Watchlist
        </p>

        <button
          type="button"
          className={styles.watchlistButton}
        >
          <span>＋</span>
          Create Watchlist
        </button>
      </div>
    </div>
  );
}