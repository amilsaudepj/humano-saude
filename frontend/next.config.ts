import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Favicon: servir o logo Humano quando o navegador pedir /favicon.ico
      { source: '/favicon.ico', destination: '/images/logos/icon-humano.png', permanent: false },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tcfwuykrzeialpakfdkc.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'humanosaude.com.br',
      },
      {
        protocol: 'https',
        hostname: 'www.humanosaude.com.br',
      },
      {
        protocol: 'https',
        hostname: 'mattosconnect.com.br',
      },
      {
        protocol: 'https',
        hostname: 'www.mattosconnect.com.br',
      },
      {
        protocol: 'https',
        hostname: 'mattosconnect.com',
      },
    ],
  },
  
  async headers() {
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';
    const isDev = process.env.NODE_ENV === 'development';

    // ─── DEV: sem CSP (evita bloqueio WebSocket HMR, scripts, assets 404) ───
    // PROD: CSP restrito
    const cspValue = isDev
      ? null // sem CSP em dev = zero bloqueio
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.google.com *.googleapis.com *.googletagmanager.com *.facebook.net *.google-analytics.com *.hotjar.com *.hotjar.io *.contentsquare.net *.heapanalytics.com cserror.com",
          "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
          "img-src 'self' data: https: blob: *.heapanalytics.com",
          "font-src 'self' data: fonts.gstatic.com",
          "connect-src 'self' *.supabase.co *.google-analytics.com *.facebook.com *.facebook.net vitals.vercel-insights.com *.hotjar.com *.hotjar.io wss://*.hotjar.com wss://*.hotjar.io *.contentsquare.net *.contentsquare.com *.heapanalytics.com app.contentsquare.com tcvsapi.contentsquare.com cserror.com",
          "frame-src 'self' blob: data: *.google.com *.facebook.com",
          "media-src 'self' blob:",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
          "upgrade-insecure-requests",
        ].join('; ');

    const hstsHeader = { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' };
    const securityHeaders: { key: string; value: string }[] = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      ...(isDev ? [] : [hstsHeader]),
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
      ...(cspValue ? [{ key: 'Content-Security-Policy', value: cspValue }] : []),
    ];

    return [
      // ─── Security Headers globais ────────────────────
      {
        source: '/:path*',
        headers: securityHeaders,
      },

      // ─── CORS (API routes) ───────────────────────────
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },

      // ─── Cache: Analytics (5 min) ────────────────────
      {
        source: '/api/analytics/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, s-maxage=300, stale-while-revalidate=600' },
        ],
      },

      // ─── Cache: Admin analytics (5 min) ──────────────
      {
        source: '/api/admin/analytics/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, s-maxage=300, stale-while-revalidate=600' },
        ],
      },

      // ─── Cache: Ads cockpit/metrics (5 min) ──────────
      {
        source: '/api/ads/cockpit',
        headers: [
          { key: 'Cache-Control', value: 'private, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/api/ads/metrics',
        headers: [
          { key: 'Cache-Control', value: 'private, s-maxage=300, stale-while-revalidate=600' },
        ],
      },

      // ─── Cache: Consolidated metrics (5 min) ─────────
      {
        source: '/api/consolidated/metrics',
        headers: [
          { key: 'Cache-Control', value: 'private, s-maxage=300, stale-while-revalidate=600' },
        ],
      },

      // ─── Cache: Health (1 min) ───────────────────────
      {
        source: '/api/health',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },

      // ─── Cache: Sitemap (24h) ────────────────────────
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
