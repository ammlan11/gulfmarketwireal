import { NextResponse } from "next/server";
import { getMarketQuotes } from "@/services/market-data.service";

export async function GET() {
  try {
    const quotes = await getMarketQuotes();

    return NextResponse.json({
      success: quotes.length > 0,
      quotes,
      status:
        quotes.length > 0
          ? "live"
          : "unavailable",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn(
      "Market data temporarily unavailable:",
      error
    );

    return NextResponse.json({
      success: false,
      quotes: [],
      status: "unavailable",
      updatedAt: new Date().toISOString(),
    });
  }
}