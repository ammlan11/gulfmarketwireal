import { NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

// Drop expired entries now and then so the store can't grow forever.
let lastSweep = 0;
function sweepExpired(now: number) {
  if (now - lastSweep < 60 * 1000) return;
  lastSweep = now;
  for (const key of Object.keys(store)) {
    if (store[key].resetAt < now) delete store[key];
  }
}

/*
 * The visitor's real IP, for rate limiting.
 *
 * Behind nginx, use X-Real-IP (nginx sets it from the TCP connection, so a
 * visitor can't fake it). Otherwise use the LAST X-Forwarded-For entry: that
 * is the one our proxy appended. The first entry is whatever the visitor
 * typed, so keying on it let anyone dodge the limits by changing it.
 *
 * nginx needs:  proxy_set_header X-Real-IP $remote_addr;
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }

  return "unknown";
}

/*
 * Simple in-memory sliding window rate limiter
 * Limits requests per IP within a specified time window.
 */
export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  sweepExpired(now);
  const record = store[ip];

  if (!record || now > record.resetAt) {
    store[ip] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return { success: true, remaining: limit - 1, reset: store[ip].resetAt };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetAt };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, reset: record.resetAt };
}

/*
 * Helper to validate CSRF / Same-Origin headers on mutation requests.
 *
 * Reverse-proxy aware: When running behind Nginx on a VPS, the internal
 * `host` header may be `localhost:3000` while the browser sends
 * `origin: https://news.znrsolutions.com`. We resolve this by also
 * accepting an origin that matches NEXT_PUBLIC_SITE_URL (the public domain).
 */
export function validateCsrfHeader(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) {
    // No origin header – allow unless explicitly cross-site
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite && fetchSite === "cross-site") {
      return false;
    }
    return true;
  }

  try {
    const originHost = new URL(origin).host;

    // 1. Standard same-origin check (local dev)
    if (originHost === host) return true;

    // 2. Reverse-proxy / VPS check: compare against the configured public URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      const configuredHost = new URL(siteUrl).host;
      if (originHost === configuredHost) return true;
    }

    return false;
  } catch {
    return false;
  }
}

/*
 * One-line guard for signed-in actions that change data (account settings,
 * password, saved articles): blocks cross-site requests and rate-limits per IP.
 * Returns a response to send back when the request must stop, or null.
 */
export function guardMutation(
  request: Request,
  action: string,
  limit = 20,
  windowMs = 60 * 1000
): NextResponse | null {
  if (!validateCsrfHeader(request)) {
    return NextResponse.json(
      { success: false, message: "Cross-site request blocked." },
      { status: 403 }
    );
  }

  const check = checkRateLimit(`${action}:${getClientIp(request)}`, limit, windowMs);
  if (!check.success) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  return null;
}
