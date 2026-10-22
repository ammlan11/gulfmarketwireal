import type { MarketQuote } from "@/types/market-quote";
import styles from "./MarketTicker.module.scss";

type MarketTickerProps = {
  quotes: MarketQuote[];
};

export default function MarketTicker({
  quotes,
}: MarketTickerProps) {
  function formatPrice(quote: MarketQuote) {
    if (quote.price === null) {
      return "—";
    }

    if (quote.symbol.startsWith("BTC")) {
      return quote.price.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      });
    }

    if (quote.symbol.includes("/")) {
      return quote.price.toFixed(5);
    }

    return quote.price.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  }

  return (
    <section className={styles.ticker}>
      <div className={styles.container}>
        

        <div className={styles.track}>
          {quotes.length === 0 ? (
            <div className={styles.unavailable}>
              Market data temporarily unavailable
            </div>
          ) : (
            quotes.map((quote) => {
              const positive =
                quote.direction === "up";

              const negative =
                quote.direction === "down";

              const closed = quote.marketOpen === false;

              return (
                <div
                  key={quote.id}
                  className={
                    closed
                      ? `${styles.quote} ${styles.quoteClosed}`
                      : styles.quote
                  }
                  title={
                    closed
                      ? `${quote.symbol}: market closed, showing last close`
                      : undefined
                  }
                >
                  <strong>{quote.symbol}</strong>

                  <span className={styles.price}>
                    {formatPrice(quote)}
                  </span>

                  {closed && (
                    <span className={styles.closeTag}>Close</span>
                  )}

                  {quote.changePercent !== null && (
                    <span
                      className={
                        positive
                          ? styles.positive
                          : negative
                            ? styles.negative
                            : styles.flat
                      }
                    >
                      {positive
                        ? "▲"
                        : negative
                          ? "▼"
                          : "•"}{" "}
                      {Math.abs(
                        quote.changePercent
                      ).toFixed(2)}
                      %
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}