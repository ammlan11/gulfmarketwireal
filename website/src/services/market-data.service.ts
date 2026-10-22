import type { MarketQuote } from "@/types/market-quote";

import { prisma } from "@/lib/prisma";
import { isMarketOpen, sessionFor } from "@/lib/market-hours";

const MARKET_API_BASE_URL = process.env.MARKET_API_BASE_URL;

// Keep cache short because this is market data.
const CACHE_DURATION_MS = 15 * 1000;

type AgeraMarket = {
  pair: string;
  price: number;
  category?: string;
  defaultLeverage?: number;
  updatedAt?: string;
  contractSize?: number;
  quoteCurrency?: string;
  spread?: number;
  swapLong?: number;
  swapShort?: number;
  minLotSize?: number;
  lotStep?: number;
  change24h?: number;
  sparklineData?: unknown;
  displaySymbol?: string;
  iconUrl?: string | null;
  secondaryIconUrl?: string | null;
  iconFallback?: string | null;
  disclaimerMessage?: string | null;
  featured?: boolean;
};

type AgeraMarketsResponse =
  | AgeraMarket[]
  | {
      content?: AgeraMarket[];
      markets?: AgeraMarket[];
      data?: AgeraMarket[];
      Count?: number;
      count?: number;
    };

export type MarketKline = {
  open: string;
  high: string;
  volume: string;
  datetime: string;
  low: string;
  close: string;
};

export type MarketKlinesResponse = {
  meta: {
    symbol: string;
    interval: string;
    source: string;
  };
  values: MarketKline[];
  status: string;
};

let cachedQuotes: MarketQuote[] = [];
let cacheExpiresAt = 0;
let refreshPromise: Promise<MarketQuote[]> | null = null;

function getDirection(
  change: number | null,
): "up" | "down" | "flat" {
  if (change === null || change === 0) {
    return "flat";
  }

  return change > 0 ? "up" : "down";
}

function normalizeSymbol(symbol: string): string {
  return symbol
    .trim()
    .toUpperCase()
    .replaceAll("/", "");
}

function formatDisplaySymbol(market: AgeraMarket): string {
  const symbol = market.displaySymbol || market.pair;

  // Make common FX symbols easier to read in the existing UI.
  if (
    market.category === "FOREX" &&
    symbol.length === 6
  ) {
    return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }

  return symbol;
}

function parseMarket(market: AgeraMarket): MarketQuote | null {
  const price = Number(market.price);

  if (!Number.isFinite(price)) {
    return null;
  }

  // No change figure from the feed = unknown, not 0%.
  const rawChange =
    market.change24h === null || market.change24h === undefined
      ? NaN
      : Number(market.change24h);

  const change = Number.isFinite(rawChange)
    ? rawChange
    : null;

  return {
    id: market.pair.toLowerCase(),
    symbol: formatDisplaySymbol(market),
    name: market.displaySymbol || market.pair,
    price,
    change,
    changePercent: change,
    direction: getDirection(change),
    marketOpen: isMarketOpen(sessionFor(market.pair, market.category)),
  };
}

/* ========================================
   CLOSING PRICES
   ========================================

   While a market is open we remember each instrument's latest
   price and change (in memory, and in the MarketClose table so it
   survives restarts). When the market is closed, the ticker shows
   that remembered last-session price — the close — instead of
   whatever the feed sends out of hours.
*/

type SessionPrice = { price: number; change: number | null };

const lastSession = new Map<string, SessionPrice>();

let closesLoaded = false;
let lastSavedAt = 0;

const SAVE_EVERY_MS = 60 * 1000;

async function loadSavedCloses() {
  if (closesLoaded) return;

  closesLoaded = true;

  try {
    const rows = await prisma.marketClose.findMany();

    for (const row of rows) {
      if (!lastSession.has(row.symbol)) {
        lastSession.set(row.symbol, { price: row.price, change: row.change });
      }
    }
  } catch (error) {
    console.warn("Unable to load saved closing prices:", error);
  }
}

async function saveCloses(quotes: MarketQuote[]) {
  const now = Date.now();

  if (now - lastSavedAt < SAVE_EVERY_MS) return;

  lastSavedAt = now;

  const open = quotes.filter((quote) => quote.marketOpen && quote.price !== null);

  if (open.length === 0) return;

  try {
    await prisma.$transaction(
      open.map((quote) =>
        prisma.marketClose.upsert({
          where: { symbol: quote.id },
          update: { price: quote.price!, change: quote.changePercent },
          create: {
            symbol: quote.id,
            price: quote.price!,
            change: quote.changePercent,
          },
        }),
      ),
    );
  } catch (error) {
    console.warn("Unable to save closing prices:", error);
  }
}

async function applyClosingPrices(quotes: MarketQuote[]): Promise<MarketQuote[]> {
  await loadSavedCloses();

  const result = quotes.map((quote) => {
    if (quote.marketOpen !== false) {
      if (quote.price !== null) {
        lastSession.set(quote.id, {
          price: quote.price,
          change: quote.changePercent,
        });
      }

      return quote;
    }

    const close = lastSession.get(quote.id);

    // Nothing remembered yet: the feed's price is the best close we have.
    if (!close) return quote;

    return {
      ...quote,
      price: close.price,
      change: close.change,
      changePercent: close.change,
      direction: getDirection(close.change),
    };
  });

  void saveCloses(result);

  return result;
}

async function request<T>(
  path: string,
): Promise<T> {
  if (!MARKET_API_BASE_URL) {
    throw new Error("MARKET_API_BASE_URL environment variable is missing");
  }

  const response = await fetch(
    `${MARKET_API_BASE_URL}${path}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Market API request failed: ${response.status} ${body}`,
    );
  }

  return (await response.json()) as T;
}

function extractMarkets(
  response: AgeraMarketsResponse,
): AgeraMarket[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.content)) {
    return response.content;
  }

  if (Array.isArray(response.markets)) {
    return response.markets;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

// ========================================
// ALL MARKETS
// ========================================

export async function getAllMarkets(): Promise<AgeraMarket[]> {
  const response =
    await request<AgeraMarketsResponse>(
      "/api/market/all",
    );

  return extractMarkets(response);
}

// ========================================
// SINGLE MARKET
// ========================================

export async function getMarket(
  symbol: string,
): Promise<AgeraMarket | null> {
  const normalizedSymbol =
    normalizeSymbol(symbol);

  try {
    return await request<AgeraMarket>(
      `/api/market/${encodeURIComponent(
        normalizedSymbol,
      )}`,
    );
  } catch (error) {
    console.warn(
      `Unable to fetch market ${normalizedSymbol}:`,
      error,
    );

    return null;
  }
}

// ========================================
// MARKET CATEGORIES
// ========================================

export async function getMarketCategories(): Promise<unknown> {
  return request<unknown>(
    "/api/market/categories",
  );
}

// ========================================
// KLINES / CANDLES
// ========================================

export async function getMarketKlines(
  symbol: string,
  interval = "1m",
  limit = 500,
): Promise<MarketKlinesResponse | null> {
  const normalizedSymbol =
    normalizeSymbol(symbol);

  const safeLimit = Math.min(
    Math.max(Math.trunc(limit), 1),
    500,
  );

  const params = new URLSearchParams({
    interval,
    limit: String(safeLimit),
  });

  try {
    return await request<MarketKlinesResponse>(
      `/api/market/${encodeURIComponent(
        normalizedSymbol,
      )}/klines?${params.toString()}`,
    );
  } catch (error) {
    console.warn(
      `Unable to fetch klines for ${normalizedSymbol}:`,
      error,
    );

    return null;
  }
}

// ========================================
// EXISTING WEBSITE MARKET QUOTES
// ========================================

async function fetchMarketQuotes(): Promise<MarketQuote[]> {
  try {
    const markets = await getAllMarkets();

    const quotes = markets
      .map(parseMarket)
      .filter(
        (quote): quote is MarketQuote =>
          quote !== null,
      );

    /*
     * If the feed reports 0% for every instrument, it isn't
     * sending real 24h changes. Hide them rather than show
     * a misleading wall of 0.00%.
     */
    if (
      quotes.length > 1 &&
      quotes.every((quote) => !quote.changePercent)
    ) {
      for (const quote of quotes) {
        quote.change = null;
        quote.changePercent = null;
        quote.direction = "flat";
      }
    }

    if (quotes.length > 0) {
      cachedQuotes = await applyClosingPrices(quotes);
      cacheExpiresAt =
        Date.now() + CACHE_DURATION_MS;
    }

    return cachedQuotes;
  } catch (error) {
    console.warn(
      "Unable to refresh market quotes:",
      error,
    );

    return cachedQuotes;
  }
}

export async function getMarketQuotes(): Promise<
  MarketQuote[]
> {
  const now = Date.now();

  if (
    cachedQuotes.length > 0 &&
    now < cacheExpiresAt
  ) {
    return cachedQuotes;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetchMarketQuotes();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}