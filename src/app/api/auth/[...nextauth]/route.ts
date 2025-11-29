import { handlers } from "@/lib/auth"

// Debug logging for auth configuration
console.log('[auth-route] Environment check:', {
  CORE_API_URL: process.env.CORE_API_URL ? 'SET' : 'MISSING',
  CORE_API_SECRET: process.env.CORE_API_SECRET ? `SET (${process.env.CORE_API_SECRET.length} chars)` : 'MISSING',
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? 'SET' : 'MISSING',
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? 'SET' : 'MISSING',
  AUTH_SECRET: process.env.AUTH_SECRET ? 'SET' : 'MISSING',
})

export const { GET, POST } = handlers
