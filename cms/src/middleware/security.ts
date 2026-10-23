import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

/* =========================================
   LOGIN BRUTE-FORCE PROTECTION
========================================= */

/*
 * Each IP gets MAX_FAILURES wrong passwords per WINDOW_MS. After that, the
 * login form refuses that IP until the window ends. A successful login
 * clears the count.
 *
 * Counts live in memory, so they reset when the CMS restarts. That's fine
 * for a single CMS server; move them to the database or Redis if you ever
 * run more than one.
 *
 * req.ip is the visitor's real IP because app.ts sets "trust proxy" for
 * the nginx in front of the CMS.
 */
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; resetAt: number }>();

function sweep(now: number) {
  for (const [ip, entry] of failures) {
    if (entry.resetAt < now) failures.delete(ip);
  }
}

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

/** Minutes left before this IP may try again, or 0 if it isn't blocked. */
export function loginBlockedFor(req: Request): number {
  const now = Date.now();
  const entry = failures.get(clientIp(req));
  if (!entry || entry.resetAt < now || entry.count < MAX_FAILURES) return 0;
  return Math.ceil((entry.resetAt - now) / 60000);
}

export function recordLoginFailure(req: Request) {
  const now = Date.now();
  if (failures.size > 10_000) sweep(now);

  const ip = clientIp(req);
  const entry = failures.get(ip);

  if (!entry || entry.resetAt < now) {
    failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }

  console.warn(`[security] failed CMS login from ${ip}`);
}

export function clearLoginFailures(req: Request) {
  failures.delete(clientIp(req));
}

/* =========================================
   CROSS-SITE REQUEST (CSRF) PROTECTION
========================================= */

/*
 * Every form in the CMS posts back to the CMS itself. Browsers attach an
 * Origin header to POSTs, so a POST whose Origin is a different site was
 * sent by another page trying to act with the editor's login. Refuse it.
 *
 * This works together with the SameSite=strict session cookie (app.ts).
 * Requests with a Bearer key (the ingest API) don't use the cookie and
 * are not checked here.
 */
function allowedHosts(req: Request): Set<string> {
  const hosts = new Set<string>();
  if (req.headers.host) hosts.add(req.headers.host);

  try {
    hosts.add(new URL(env.PUBLIC_BASE_URL).host);
  } catch {
    // PUBLIC_BASE_URL is validated in env.ts; nothing to add if it's odd.
  }

  return hosts;
}

export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  const origin = req.headers.origin;

  if (origin) {
    try {
      if (allowedHosts(req).has(new URL(origin).host)) return next();
    } catch {
      // Malformed Origin: fall through and refuse.
    }

    console.warn(`[security] blocked cross-site ${req.method} ${req.path} from ${origin}`);
    return res.status(403).send("Cross-site request blocked.");
  }

  // No Origin header (older browsers, some privacy tools). Fall back to the
  // browser's own Fetch Metadata if it sent any.
  if (req.headers["sec-fetch-site"] === "cross-site") {
    return res.status(403).send("Cross-site request blocked.");
  }

  next();
}
