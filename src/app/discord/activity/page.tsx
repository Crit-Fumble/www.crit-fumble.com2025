import { DiscordActivityClient } from './DiscordActivityClient'

export const metadata = {
  title: 'Crit-Fumble | Discord Activity',
  description: 'Crit-Fumble Discord Activity - Virtual Tabletop companion for your voice channel',
}

/**
 * Discord Activity Page
 *
 * This page is designed to be embedded as a Discord Activity in voice channels.
 * It runs in a "kiosk" mode with no navigation - just the activity content.
 *
 * Requirements:
 * - NEXT_PUBLIC_DISCORD_CLIENT_ID environment variable must be set
 * - Discord application must be configured with Activity URL mapping
 * - CSP headers must allow Discord's iframe embedding
 */
export default function DiscordActivityPage() {
  return <DiscordActivityClient />
}
