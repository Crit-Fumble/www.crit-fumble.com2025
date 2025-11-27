import { prisma } from '@/lib/db'

export interface LinkedAccountMetadata {
  // Discord
  username?: string
  discriminator?: string
  avatar?: string
  avatarUrl?: string

  // GitHub
  login?: string
  name?: string
  avatar_url?: string

  // Twitch
  preferred_username?: string
  picture?: string

  // Common
  email?: string

  // Additional fields
  [key: string]: any
}

export interface LinkedAccount {
  id: string
  provider: string
  providerAccountId: string
  metadata: LinkedAccountMetadata
  displayName: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Get all linked accounts for a user
 */
export async function getUserLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      metadata: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return accounts.map(account => ({
    ...account,
    metadata: account.metadata as LinkedAccountMetadata,
  }))
}

/**
 * Get linked accounts by provider
 */
export async function getUserAccountsByProvider(
  userId: string,
  provider: string
): Promise<LinkedAccount[]> {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      provider,
    },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      metadata: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return accounts.map(account => ({
    ...account,
    metadata: account.metadata as LinkedAccountMetadata,
  }))
}

/**
 * Get the user's primary account (for display)
 */
export async function getUserPrimaryAccount(
  userId: string
): Promise<LinkedAccount | null> {
  const user = await prisma.critUser.findUnique({
    where: { id: userId },
    select: { primaryAccountId: true },
  })

  if (!user?.primaryAccountId) {
    // No primary set, return the first account
    const accounts = await getUserLinkedAccounts(userId)
    return accounts[0] || null
  }

  const account = await prisma.account.findUnique({
    where: { id: user.primaryAccountId },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      metadata: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!account) return null

  return {
    ...account,
    metadata: account.metadata as LinkedAccountMetadata,
  }
}

/**
 * Get display name for an account
 * Priority: displayName > provider-specific username > email > provider ID
 */
export function getAccountDisplayName(account: LinkedAccount): string {
  if (account.displayName) {
    return account.displayName
  }

  const meta = account.metadata

  // Provider-specific username
  switch (account.provider) {
    case 'discord':
      if (meta.username) {
        return meta.discriminator ? `${meta.username}#${meta.discriminator}` : meta.username
      }
      break
    case 'github':
      if (meta.login) return meta.login
      break
    case 'twitch':
      if (meta.preferred_username) return meta.preferred_username
      break
  }

  // Fallback to email
  if (meta.email) {
    return meta.email.split('@')[0]
  }

  // Last resort: provider name + ID
  return `${account.provider}_${account.providerAccountId.slice(0, 8)}`
}

/**
 * Get avatar URL for an account
 */
export function getAccountAvatarUrl(account: LinkedAccount): string | null {
  const meta = account.metadata

  switch (account.provider) {
    case 'discord':
      return meta.avatarUrl || null
    case 'github':
      return meta.avatar_url || null
    case 'twitch':
      return meta.picture || null
    default:
      return null
  }
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    discord: 'Discord',
    github: 'GitHub',
    twitch: 'Twitch',
    battlenet: 'Battle.net',
    steam: 'Steam',
    fandom: 'Fandom',
  }
  return names[provider] || provider
}

/**
 * Get provider icon/color for UI
 */
export function getProviderBrand(provider: string): {
  color: string
  icon: string
} {
  const brands: Record<string, { color: string; icon: string }> = {
    discord: { color: '#5865F2', icon: 'discord' },
    github: { color: '#181717', icon: 'github' },
    twitch: { color: '#9146FF', icon: 'twitch' },
    battlenet: { color: '#00AEFF', icon: 'gamepad' },
    steam: { color: '#171A21', icon: 'steam' },
    fandom: { color: '#FA005A', icon: 'book' },
  }
  return brands[provider] || { color: '#6B7280', icon: 'link' }
}

/**
 * Check if a user can unlink an account (must have at least 2 accounts)
 */
export async function canUnlinkAccount(userId: string): Promise<boolean> {
  const accountCount = await prisma.account.count({
    where: { userId },
  })
  return accountCount > 1
}

/**
 * Unlink an account (with safety check)
 */
export async function unlinkAccount(
  userId: string,
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  // Safety check
  const canUnlink = await canUnlinkAccount(userId)
  if (!canUnlink) {
    return {
      success: false,
      error: 'Cannot unlink your last account. You must have at least one linked account.',
    }
  }

  // Verify ownership
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  })

  if (!account) {
    return {
      success: false,
      error: 'Account not found or does not belong to you',
    }
  }

  // Delete the account
  await prisma.account.delete({
    where: { id: accountId },
  })

  // Clear primary if this was it
  await prisma.critUser.updateMany({
    where: {
      id: userId,
      primaryAccountId: accountId,
    },
    data: {
      primaryAccountId: null,
    },
  })

  return { success: true }
}

/**
 * Set primary account for display
 */
export async function setPrimaryAccount(
  userId: string,
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify ownership
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  })

  if (!account) {
    return {
      success: false,
      error: 'Account not found or does not belong to you',
    }
  }

  // Update primary
  await prisma.critUser.update({
    where: { id: userId },
    data: { primaryAccountId: accountId },
  })

  return { success: true }
}
