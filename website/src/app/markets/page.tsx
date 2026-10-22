import type { Metadata } from "next";

import Header from "@/components/layout/Header/Header";
import MarketTicker from "@/components/home/MarketTicker/MarketTicker";

import { getMarketQuotes } from "@/services/market-data.service";

import type { MarketQuote } from "@/types/market-quote";

// Authentication is checked per request.
// Do not use page-level ISR for authenticated pages.

export const metadata: Metadata = {
  title: "Markets",
  description:
    "Live prices and moves across stocks, currencies, commodities and crypto, with Gulf and global markets coverage.",
  alternates: {
    canonical: "/markets",
  },
};

export default async function MarketsPage() {
  const [quotesResult] = await Promise.allSettled([
    getMarketQuotes(),
  ]);

  // =========================
  // MARKET DATA
  // =========================

  const quotes: MarketQuote[] =
    quotesResult.status === "fulfilled" ? quotesResult.value : [];

  if (quotesResult.status === "rejected") {
    console.warn(
      "Markets page data temporarily unavailable:",
      quotesResult.reason,
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <>
      <Header marketQuotes={quotes} />

      <MarketTicker quotes={quotes} />

      <main
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        {/* =========================
            PAGE HEADER
        ========================= */}

        <div
          style={{
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            MARKETS
          </span>

          <h1
            style={{
              margin: 0,
              fontSize: "42px",
              lineHeight: 1.1,
            }}
          >
            Global Markets
          </h1>

          <p
            style={{
              maxWidth: "680px",
              marginTop: "16px",
              lineHeight: 1.6,
            }}
          >
            Follow the latest market prices and daily movements across
            currencies and digital assets.
          </p>
        </div>

        {/* =========================
            MARKET QUOTES
        ========================= */}

        {quotes.length === 0 ? (
          <div
            style={{
              padding: "32px",
              border: "1px solid #ddd",
            }}
          >
            Market data is temporarily unavailable.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {quotes.map((quote) => (
              <article
                key={quote.id}
                style={{
                  padding: "24px",
                  border: "1px solid #ddd",
                }}
              >
                <div
                  style={{
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {quote.symbol}
                </div>

                <h2
                  style={{
                    margin: "0 0 16px",
                    fontSize: "18px",
                  }}
                >
                  {quote.name}
                </h2>

                <div
                  style={{
                    marginBottom: "8px",
                    fontSize: "28px",
                    fontWeight: 700,
                  }}
                >
                  {quote.price !== null ? quote.price.toLocaleString() : "—"}
                </div>

                <div>
                  {quote.change !== null
                    ? `${quote.change > 0 ? "+" : ""}${quote.change.toFixed(4)}`
                    : "—"}

                  {" · "}

                  {quote.changePercent !== null
                    ? `${quote.changePercent > 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`
                    : "—"}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
