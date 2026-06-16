import type { NextConfig } from "next";

// Baseline security headers. The CSP ships as Report-Only first so it cannot
// white-screen the app (the inline theme-init script + framer-motion need tuning);
// flip to enforce `Content-Security-Policy` once violation reports are clean.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join("; ");

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // SAMEORIGIN (not DENY) so same-origin embeds work — e.g. the in-app resume PDF preview (<object>).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY }
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  devIndicators: false,
  images: {
    // Candidate avatars are served from Vercel Blob public storage.
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" }
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS
      }
    ];
  }
};

export default nextConfig;
