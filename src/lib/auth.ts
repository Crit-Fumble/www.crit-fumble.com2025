/**
 * NextAuth Configuration
 *
 * Uses @crit-fumble/web-auth with Core API adapter.
 * User accounts are stored in core.crit-fumble.com for shared identity.
 * Sessions are handled via database strategy.
 */

import { createCoreAuth } from '@crit-fumble/web-auth'

export const { handlers, auth, signIn, signOut } = createCoreAuth({
  coreApiUrl: process.env.CORE_API_URL!,
  coreApiSecret: process.env.CORE_API_SECRET!,
  discordClientId: process.env.DISCORD_CLIENT_ID!,
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET!,
})
