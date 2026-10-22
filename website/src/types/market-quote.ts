export type MarketQuote = {
  id: string;
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  direction: "up" | "down" | "flat";

  // false = market closed; price/change are the last close.
  // Missing = unknown (treated as open).
  marketOpen?: boolean;
};