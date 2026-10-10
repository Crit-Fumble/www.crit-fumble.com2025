const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root: this repo lives inside a parent monorepo
  // checkout (Crit-Fumble/), which has its own lockfile. Without this,
  // Next 16's Turbopack picks the parent and fails to find our app/.
  turbopack: {
    root: __dirname,
  },

  // Plain files in out/. The site is static only (README, "Static only"):
  // nothing here may need a server — no route handlers, no middleware, no
  // headers()/redirects(). Response headers live in public/_headers.
  output: 'export',

  // The image optimizer is a server. Images ship as the files in public/.
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
