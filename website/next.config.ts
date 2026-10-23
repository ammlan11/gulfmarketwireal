import type { NextConfig } from "next";

/*
 * Image hosts the optimizer may fetch from. Keep this an allow-list:
 * a wildcard (hostname "**") turns /_next/image into an open proxy.
 *
 * The CMS host comes from NEWS_API_URL (e.g. https://cms.gulfmarketwire.com),
 * so a new CMS domain needs no code change. Add other hosts here only when
 * a page really shows their images through next/image.
 */
function cmsImagePattern() {
  const raw = process.env.NEWS_API_URL;
  if (!raw) return [];

  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/uploads/news/**",
      },
    ];
  } catch {
    return [];
  }
}

/*
 * Security headers sent with every page.
 *
 * The Content-Security-Policy below blocks the dangerous basics (plugins,
 * <base> hijacking, posting forms to other sites, other sites framing us)
 * without restricting scripts, because a script policy needs per-request
 * nonces, which would switch off page caching (ISR). Tighten it later if
 * the site moves to fully dynamic rendering.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  // Live TV embeds
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  // https: covers the live CMS; the localhost entries are for local development.
  "img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",

  // Don't advertise the framework in every response.
  poweredByHeader: false,

  images: {
    remotePatterns: [
      ...cmsImagePattern(),

      // Production CMS (also covered by NEWS_API_URL when it points here)
      {
        protocol: "https",
        hostname: "cms.gulfmarketwire.com",
        pathname: "/uploads/news/**",
      },

      // Local CMS during development
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/news/**",
      },
    ],

    // The image optimizer never needs to render SVG (SVG + optimizer is
    // the path behind one of the Next.js remote-code advisories).
    dangerouslyAllowSVG: false,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
