/*
 * Trading hours per instrument type, used by the ticker to show
 * the closing price when a market is shut.
 *
 * All sessions are defined in New York time, the standard
 * reference for US stocks, forex and commodity CFDs.
 *
 *   US stocks    Mon–Fri 09:30–16:00 (early 13:00 close on some days),
 *                closed on NYSE holidays
 *   Forex        Sunday 17:00 → Friday 17:00, around the clock
 *   Commodities  Sunday 18:00 → Friday 17:00, with a daily
 *                17:00–18:00 break (gold, silver, oil, gas, metals)
 *   Crypto       always open
 *
 * UPDATE THE HOLIDAY LISTS EACH YEAR (nyse.com/markets/hours-calendars).
 */

export type MarketSession = "US_STOCK" | "FOREX" | "COMMODITY" | "CRYPTO";

const NY_TIME_ZONE = "America/New_York";

// NYSE full-day closures (YYYY-MM-DD, New York date).
const NYSE_HOLIDAYS = new Set([
  // 2026
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25",
  "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25",
  // 2027
  "2027-01-01", "2027-01-18", "2027-02-15", "2027-03-26", "2027-05-31",
  "2027-06-18", "2027-07-05", "2027-09-06", "2027-11-25", "2027-12-24",
]);

// NYSE early closes at 13:00 New York time.
const NYSE_EARLY_CLOSES = new Set(["2026-11-27", "2026-12-24", "2027-11-26"]);

const CURRENCIES = new Set([
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "CNH",
  "HKD", "SGD", "SEK", "NOK", "DKK", "ZAR", "MXN", "TRY", "INR", "AED",
  "SAR", "QAR", "KWD", "BHD", "OMR", "PLN", "HUF", "CZK",
]);

const COMMODITY_HINTS = [
  "XAU", "XAG", "XPT", "XPD", "GOLD", "SILVER", "OIL", "BRENT", "WTI",
  "NGAS", "GAS", "PALLADIUM", "PLATINUM", "COPPER", "ZINC", "NICKEL",
  "ALUMINIUM", "ALUMINUM",
];

/*
 * Work out which trading session an instrument follows, from the
 * feed's category where it gives one, otherwise from the symbol.
 */
export function sessionFor(symbol: string, category?: string): MarketSession {
  const sym = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const cat = (category ?? "").toUpperCase();

  if (cat.includes("CRYPTO") || /USDT$|USDC$/.test(sym)) {
    return "CRYPTO";
  }

  if (
    /COMMOD|METAL|ENERGY/.test(cat) ||
    COMMODITY_HINTS.some((hint) => sym.startsWith(hint)) ||
    /(OIL|GAS)$/.test(sym)
  ) {
    return "COMMODITY";
  }

  if (
    cat.includes("FOREX") ||
    cat === "FX" ||
    (sym.length === 6 &&
      CURRENCIES.has(sym.slice(0, 3)) &&
      CURRENCIES.has(sym.slice(3)))
  ) {
    return "FOREX";
  }

  return "US_STOCK";
}

type NyClock = {
  date: string; // YYYY-MM-DD
  weekday: number; // 0 = Sunday
  minutes: number; // minutes since midnight
};

function nyClock(now: Date): NyClock {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: NY_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: weekdays.indexOf(parts.weekday),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

const at = (hours: number, minutes = 0) => hours * 60 + minutes;

export function isMarketOpen(session: MarketSession, now = new Date()): boolean {
  if (session === "CRYPTO") {
    return true;
  }

  const { date, weekday, minutes } = nyClock(now);

  if (session === "US_STOCK") {
    if (weekday === 0 || weekday === 6 || NYSE_HOLIDAYS.has(date)) {
      return false;
    }

    const close = NYSE_EARLY_CLOSES.has(date) ? at(13) : at(16);

    return minutes >= at(9, 30) && minutes < close;
  }

  // Forex and commodities: Sunday evening to Friday 17:00.
  if (weekday === 6) return false;
  if (weekday === 5 && minutes >= at(17)) return false;

  if (session === "FOREX") {
    if (weekday === 0) return minutes >= at(17);
    return true;
  }

  // COMMODITY: also a daily 17:00–18:00 break.
  if (weekday === 0) return minutes >= at(18);

  return !(minutes >= at(17) && minutes < at(18));
}
