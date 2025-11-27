/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirect apex domain to www subdomain
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'crit-fumble.com',
          },
        ],
        destination: 'https://www.crit-fumble.com/:path*',
        permanent: true,
      },
    ]
  },

  // Proxy core.crit-fumble.com to Core Concepts API droplet
  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'core.crit-fumble.com',
          },
        ],
        destination: 'http://104.236.255.79:3100/:path*',
      },
    ]
  },

  // Security headers
  async headers() {
    // Common security headers (shared between standard and Discord Activity pages)
    const commonHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
    ]

    return [
      // Discord Activity pages - allow embedding in Discord iframe
      {
        source: '/discord/:path*',
        headers: [
          ...commonHeaders,
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            // CSP for Discord Activity - allows Discord to embed this page
            // Note: No X-Frame-Options here as it conflicts with frame-ancestors
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://discord.com https://*.discord.com https://api.anthropic.com https://api.openai.com",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // Allow Discord to embed this page in an iframe
              "frame-ancestors 'self' https://discord.com https://*.discord.com https://*.discordsays.com",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
      // Standard pages - default security headers
      {
        source: '/:path*',
        headers: [
          ...commonHeaders,
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.anthropic.com https://api.openai.com https://www.worldanvil.com",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.worldanvil.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Skip TypeScript checks during build (check in CI instead)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable Turbopack (Next.js 16 default)
  turbopack: {},

  // Webpack config
  webpack: (config) => {
    return config
  },
}

module.exports = nextConfig
