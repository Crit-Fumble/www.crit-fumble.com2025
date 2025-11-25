/**
 * Discord API Integration
 * Fetches server statistics from Discord using the Bot API
 */

export interface DiscordGuildStats {
  memberCount: number
  onlineCount: number
  channelCount: number
  messageCount24h?: number // Optional as we may not track this initially
}

export interface DiscordChannel {
  id: string
  name: string
  type: number // 0=text, 2=voice, 4=category, 5=announcement, etc.
  position: number
  parent_id?: string | null
  topic?: string | null
}

export interface DiscordRole {
  id: string
  name: string
  color: number
  position: number
  permissions: string
  managed: boolean
  mentionable: boolean
  hoist: boolean // Display role members separately
  icon?: string | null
  unicode_emoji?: string | null
}

export interface DiscordMember {
  user: {
    id: string
    username: string
    discriminator: string
    avatar: string | null
    bot?: boolean
  }
  nick?: string | null
  roles: string[]
  joined_at: string
  premium_since?: string | null
}

/**
 * Get Discord bot token from environment
 */
function getDiscordBotToken(): string | null {
  return process.env.DISCORD_BOT_TOKEN || null
}

/**
 * Get Discord server (guild) ID from environment
 */
function getDiscordServerId(): string | null {
  return process.env.DISCORD_SERVER_ID || null
}

/**
 * Fetch guild (server) information from Discord API
 */
async function fetchGuildInfo(guildId: string, botToken: string) {
  // Ensure bot token doesn't already have "Bot " prefix
  const cleanToken = botToken.startsWith('Bot ') ? botToken.slice(4) : botToken

  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
    headers: {
      Authorization: `Bot ${cleanToken}`,
    },
    next: { revalidate: 60 }, // Cache for 60 seconds
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Discord API error (${response.status}):`, error)
    throw new Error(`Discord API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Fetch all channels in the guild
 */
async function fetchGuildChannels(guildId: string, botToken: string) {
  // Ensure bot token doesn't already have "Bot " prefix
  const cleanToken = botToken.startsWith('Bot ') ? botToken.slice(4) : botToken

  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: {
      Authorization: `Bot ${cleanToken}`,
    },
    next: { revalidate: 300 }, // Cache for 5 minutes (channels don't change often)
  })

  if (!response.ok) {
    console.warn('Failed to fetch guild channels:', response.status)
    return []
  }

  return response.json()
}

/**
 * Get Discord server statistics
 * Returns null if Discord integration is not configured
 */
export async function getDiscordStats(): Promise<DiscordGuildStats | null> {
  const botToken = getDiscordBotToken()
  const guildId = getDiscordServerId()

  // Return null if Discord is not configured
  if (!botToken || !guildId) {
    console.log('Discord integration not configured')
    return null
  }

  try {
    // Fetch guild info with member counts
    const guildInfo = await fetchGuildInfo(guildId, botToken)

    // Fetch channels to count active channels
    const channels = await fetchGuildChannels(guildId, botToken)

    // Count text, voice, and announcement channels (excluding categories and threads)
    const activeChannels = channels.filter((channel: any) =>
      [0, 2, 5].includes(channel.type) // 0=text, 2=voice, 5=announcement
    )

    return {
      memberCount: guildInfo.approximate_member_count || 0,
      onlineCount: guildInfo.approximate_presence_count || 0,
      channelCount: activeChannels.length,
      // messageCount24h will be undefined for now - we'd need to track this separately
    }
  } catch (error) {
    console.error('Failed to fetch Discord stats:', error)
    return null
  }
}

/**
 * Check if Discord integration is configured
 */
export function isDiscordConfigured(): boolean {
  return !!(getDiscordBotToken() && getDiscordServerId())
}

/**
 * Fetch all roles in the guild
 */
export async function getDiscordRoles(): Promise<DiscordRole[]> {
  const botToken = getDiscordBotToken()
  const guildId = getDiscordServerId()

  if (!botToken || !guildId) {
    return []
  }

  try {
    const cleanToken = botToken.startsWith('Bot ') ? botToken.slice(4) : botToken
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${cleanToken}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.warn('Failed to fetch guild roles:', response.status)
      return []
    }

    return response.json()
  } catch (error) {
    console.error('Failed to fetch Discord roles:', error)
    return []
  }
}

/**
 * Get detailed channel list
 */
export async function getDiscordChannels(): Promise<DiscordChannel[]> {
  const botToken = getDiscordBotToken()
  const guildId = getDiscordServerId()

  if (!botToken || !guildId) {
    return []
  }

  try {
    const channels = await fetchGuildChannels(guildId, botToken)
    return channels as DiscordChannel[]
  } catch (error) {
    console.error('Failed to fetch Discord channels:', error)
    return []
  }
}

/**
 * Fetch guild members (limited to 1000 by default)
 */
export async function getDiscordMembers(limit: number = 1000): Promise<DiscordMember[]> {
  const botToken = getDiscordBotToken()
  const guildId = getDiscordServerId()

  if (!botToken || !guildId) {
    return []
  }

  try {
    const cleanToken = botToken.startsWith('Bot ') ? botToken.slice(4) : botToken
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=${limit}`, {
      headers: {
        Authorization: `Bot ${cleanToken}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.warn('Failed to fetch guild members:', response.status)
      return []
    }

    return response.json()
  } catch (error) {
    console.error('Failed to fetch Discord members:', error)
    return []
  }
}

/**
 * Get detailed Discord stats with roles, channels, and members breakdown
 */
export async function getDetailedDiscordStats(): Promise<{
  stats: DiscordGuildStats | null
  roles: DiscordRole[]
  channels: DiscordChannel[]
  members: DiscordMember[]
  channelsByType: {
    text: number
    voice: number
    announcement: number
    category: number
    forum: number
  }
  rolesByType: {
    managed: number
    custom: number
    mentionable: number
  }
  membersByType: {
    bots: number
    humans: number
    boosters: number
  }
}> {
  const [stats, roles, channels, members] = await Promise.all([
    getDiscordStats(),
    getDiscordRoles(),
    getDiscordChannels(),
    getDiscordMembers(),
  ])

  // Count channels by type
  const channelsByType = {
    text: channels.filter(c => c.type === 0).length,
    voice: channels.filter(c => c.type === 2).length,
    announcement: channels.filter(c => c.type === 5).length,
    category: channels.filter(c => c.type === 4).length,
    forum: channels.filter(c => c.type === 15).length,
  }

  // Count roles by type
  const rolesByType = {
    managed: roles.filter(r => r.managed).length,
    custom: roles.filter(r => !r.managed).length,
    mentionable: roles.filter(r => r.mentionable).length,
  }

  // Count members by type
  const membersByType = {
    bots: members.filter(m => m.user.bot).length,
    humans: members.filter(m => !m.user.bot).length,
    boosters: members.filter(m => m.premium_since).length,
  }

  return {
    stats,
    roles,
    channels,
    members,
    channelsByType,
    rolesByType,
    membersByType,
  }
}
