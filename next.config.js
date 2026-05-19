const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root: this repo lives inside a parent monorepo
  // checkout (Crit-Fumble/), which has its own lockfile. Without this,
  // Next 16's Turbopack picks the parent and fails to find our app/.
  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      {
        // Standard security headers — Next.js sets immutable cache headers
        // for /_next/static automatically, so we don't override that.
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: wss: ws:",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Apex → www canonical redirect.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'crit-fumble.com' }],
        destination: 'https://www.crit-fumble.com/:path*',
        permanent: true,
      },
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
