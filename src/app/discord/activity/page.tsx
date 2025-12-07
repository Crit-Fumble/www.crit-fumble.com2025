import { DiscordActivityClient } from './DiscordActivityClient'

export const metadata = {
  title: 'Discord Activity - Crit-Fumble',
  description: 'Terminal sandbox for Discord Activities',
}

/**
 * Discord Activity Page
 *
 * This page is embedded in Discord as an Activity.
 * It provides a terminal sandbox for users in voice channels.
 *
 * Authentication flow:
 * 1. Discord SDK provides access_token
 * 2. Exchange token with Core API for session
 * 3. Start/connect to container for guild+channel
 */
export default function DiscordActivityPage() {
  return <DiscordActivityClient />
}
