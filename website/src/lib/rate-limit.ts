import { NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

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
