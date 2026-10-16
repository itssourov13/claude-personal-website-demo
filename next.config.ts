import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === "1";

const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

/**
 * Content-Security-Policy (production posture for a Next.js App Router site).
 *
 * Design notes:
 * - `script-src` keeps `'unsafe-inline'` because App Router streaming/next-themes
 *   emit inline bootstrap scripts. The upgrade path is nonce-based CSP via a
 *   middleware — revisit if the threat model changes. `'unsafe-eval'` is locked
 *   to development (Next.js dev tooling) and excluded from production builds.
 * - `connect-src` is `'self'` only: the contact form posts same-origin and
 *   Resend is called server-side. If Plausible analytics is ever added, extend
 *   `connect-src`/`script-src` with its origin.
 * - `font-src 'self' data:` — next/font self-hosts Google Fonts at build time.
 * - `upgrade-insecure-requests` and HSTS are production-only, and are omitted
 *   from the dedicated Playwright build because its local test server uses HTTP.
 *   Normal production builds keep both protections enabled.
 */
function buildCsp(): string {
  const policies = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (isProd && !isPlaywrightTest) {
    policies.push("upgrade-insecure-requests");
  }

  return policies.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildCsp() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS is only meaningful over HTTPS; applied in production only so local
  // http://localhost dev is never affected.
  ...(isProd && !isPlaywrightTest
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
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
