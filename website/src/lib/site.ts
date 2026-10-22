/*
 * Site-wide details used for SEO, sharing previews and legal pages.
 */

export const SITE_NAME = "Gulf Market Wire";

// Set NEXT_PUBLIC_SITE_URL on the server (e.g. https://gulfmarketwire.com).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://gulfmarketwire.com"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Gulf and global markets news: GCC stocks, oil, gold, the dollar, central banks, finance, economics and technology.";

// Default image for link previews (WhatsApp, LinkedIn, X, etc.).
export const DEFAULT_SHARE_IMAGE = "/og-default.png";

export function articlePath(id: string): string {
  return `/news/${encodeURIComponent(id)}`;
}

// Short, single-line text for meta descriptions.
export function metaDescription(text: string | null | undefined): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();

  if (clean.length <= 160) return clean;

  return `${clean.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}
