/** @type {import('next').NextConfig} */

// Vercel Live feedback widget - only needed in preview/staging
const isPreview = process.env.VERCEL_ENV === 'preview'
const vercelLiveScripts = isPreview ? ' https://vercel.live' : ''
const vercelLiveConnect = isPreview ? ' https://vercel.live https://*.pusher.com wss://*.pusher.com' : ''

// Discord client IDs for frame-ancestors (both web app and bot)
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || ''
const FUMBLEBOT_CLIENT_ID = process.env.FUMBLEBOT_DISCORD_CLIENT_ID || ''
const discordFrameAncestors = [
  DISCORD_CLIENT_ID && `https://${DISCORD_CLIENT_ID}.discordsays.com`,
  FUMBLEBOT_CLIENT_ID && `https://${FUMBLEBOT_CLIENT_ID}.discordsays.com`,
].filter(Boolean).join(' ')

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

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
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
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-eval' 'unsafe-inline'${vercelLiveScripts}`, // Next.js requires unsafe-eval and unsafe-inline
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              `connect-src 'self' https://discord.com https://*.discord.com${vercelLiveConnect}`,
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://www.crit-fumble.com https://*.crit-fumble.com",
              `frame-ancestors 'self' ${discordFrameAncestors}`,
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
