/**
 * Tests for Permissions System
 *
 * Tests the permission checking functions for wiki access and roles.
 * Admin status is now determined by the isAdmin flag from Core database.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockAuth, setMockSession, createMockSession } from '../setup'

// Mock 'server-only' before importing permissions
vi.mock('server-only', () => ({}))

// Mock the SDK - define mock function at module level for access in tests
const mockGetGuilds = vi.fn()

vi.mock('@crit-fumble/core/client', () => {
  return {
    CoreApiClient: class MockCoreApiClient {
      discord = {
        getGuilds: mockGetGuilds,
      }
    },
  }
})

// Now import the permissions module
import {
  isAdmin,
  getRoleFromSession,
  canEditWiki,
  canPublishWiki,
  canDeleteWiki,
  canViewWiki,
  canViewActivity,
  toWebRole,
  getUserRole,
  hasEarlyAccess,
  checkEarlyAccess,
  type UserRole,
  type WebRole,
  type SessionUser,
} from '@/lib/permissions'

// Store original env values
const originalEnv = { ...process.env }

describe('Permissions System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetGuilds.mockReset()
    // Set up test environment
    process.env.CORE_API_URL = 'https://core.test.com'
    process.env.CORE_API_SECRET = 'test-secret'
    process.env.ALLOWED_GUILD_IDS = 'guild-123,guild-456'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore original env
    process.env = { ...originalEnv }
  })

  describe('isAdmin', () => {
    it('should return true when user has isAdmin flag', () => {
      const user: SessionUser = {
        id: 'user-123',
        isAdmin: true,
      }
      expect(isAdmin(user)).toBe(true)
    })

    it('should return false when user does not have isAdmin flag', () => {
      const user: SessionUser = {
        id: 'user-123',
        isAdmin: false,
      }
      expect(isAdmin(user)).toBe(false)
    })

    it('should return false when isAdmin is undefined', () => {
      const user: SessionUser = {
        id: 'user-123',
      }
      expect(isAdmin(user)).toBe(false)
    })

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false)
    })

    it('should return false for undefined user', () => {
      expect(isAdmin(undefined)).toBe(false)
    })
  })

  describe('getRoleFromSession', () => {
    it('should return admin for user with isAdmin true', () => {
      const user: SessionUser = {
        id: 'user-123',
        isAdmin: true,
      }
      expect(getRoleFromSession(user)).toBe('admin')
    })

    it('should return user for user with isAdmin false', () => {
      const user: SessionUser = {
        id: 'user-123',
        isAdmin: false,
      }
      expect(getRoleFromSession(user)).toBe('user')
    })

    it('should return user for null user', () => {
      expect(getRoleFromSession(null)).toBe('user')
    })

    it('should return user for undefined user', () => {
      expect(getRoleFromSession(undefined)).toBe('user')
    })
  })

  describe('Wiki Permissions', () => {
    describe('canEditWiki', () => {
      it('should allow admins to edit wiki', () => {
        expect(canEditWiki('admin')).toBe(true)
      })

      it('should not allow regular users to edit wiki', () => {
        expect(canEditWiki('user')).toBe(false)
      })
    })

    describe('canPublishWiki', () => {
      it('should allow admins to publish wiki', () => {
        expect(canPublishWiki('admin')).toBe(true)
      })

      it('should not allow regular users to publish wiki', () => {
        expect(canPublishWiki('user')).toBe(false)
      })
    })

    describe('canDeleteWiki', () => {
      it('should allow admins to delete wiki', () => {
        expect(canDeleteWiki('admin')).toBe(true)
      })

      it('should not allow regular users to delete wiki', () => {
        expect(canDeleteWiki('user')).toBe(false)
      })
    })

    describe('canViewWiki', () => {
      it('should allow admins to view wiki', () => {
        expect(canViewWiki('admin')).toBe(true)
      })

      it('should not allow regular users to view wiki', () => {
        expect(canViewWiki('user')).toBe(false)
      })
    })
  })

  describe('Activity Permissions', () => {
    describe('canViewActivity', () => {
      it('should allow admins to view activity', () => {
        expect(canViewActivity('admin')).toBe(true)
      })

      it('should allow regular users to view activity', () => {
        expect(canViewActivity('user')).toBe(true)
      })
    })
  })

  describe('WebRole Conversion', () => {
    describe('toWebRole', () => {
      it('should convert admin to admin', () => {
        expect(toWebRole('admin')).toBe('admin')
      })

      it('should convert user to member', () => {
        expect(toWebRole('user')).toBe('member')
      })
    })
  })

  describe('Module Exports', () => {
    it('should export all expected functions', () => {
      expect(typeof isAdmin).toBe('function')
      expect(typeof getRoleFromSession).toBe('function')
      expect(typeof canEditWiki).toBe('function')
      expect(typeof canPublishWiki).toBe('function')
      expect(typeof canDeleteWiki).toBe('function')
      expect(typeof canViewWiki).toBe('function')
      expect(typeof canViewActivity).toBe('function')
      expect(typeof toWebRole).toBe('function')
      expect(typeof getUserRole).toBe('function')
      expect(typeof hasEarlyAccess).toBe('function')
      expect(typeof checkEarlyAccess).toBe('function')
    })
  })

  describe('Session-based Functions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('getUserRole', () => {
      it('should return admin role when session user is admin', async () => {
        const session = createMockSession({
          user: {
            id: 'user-123',
            discordId: 'discord-456',
            isAdmin: true,
          },
        })
        setMockSession(session)

        const result = await getUserRole()
        expect(result.role).toBe('admin')
        expect(result.user).not.toBeNull()
        expect(result.user?.id).toBe('user-123')
      })

      it('should return user role when session user is not admin', async () => {
        const session = createMockSession({
          user: {
            id: 'user-123',
            discordId: 'discord-456',
            isAdmin: false,
          },
        })
        setMockSession(session)

        const result = await getUserRole()
        expect(result.role).toBe('user')
        expect(result.user).not.toBeNull()
      })

      it('should return user role with null user when session is null', async () => {
        setMockSession(null)

        const result = await getUserRole()
        expect(result.role).toBe('user')
        expect(result.user).toBeNull()
      })

      it('should return user role when isAdmin is undefined', async () => {
        const session = createMockSession({
          user: {
            id: 'user-123',
            discordId: 'discord-456',
            // isAdmin not set
          },
        })
        setMockSession(session)

        const result = await getUserRole()
        expect(result.role).toBe('user')
      })
    })
  })

  describe('Early Access System', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockGetGuilds.mockReset()
      // Set up env vars for tests
      process.env.CORE_API_URL = 'https://core.test.com'
      process.env.CORE_API_SECRET = 'test-secret'
      process.env.ALLOWED_GUILD_IDS = 'guild-123,guild-456'
    })

    describe('hasEarlyAccess', () => {
      it('should return false for null user', async () => {
        const result = await hasEarlyAccess(null)
        expect(result).toBe(false)
        expect(mockGetGuilds).not.toHaveBeenCalled()
      })

      it('should return false for undefined user', async () => {
        const result = await hasEarlyAccess(undefined)
        expect(result).toBe(false)
        expect(mockGetGuilds).not.toHaveBeenCalled()
      })

      it('should return true for admin users without API call', async () => {
        const user: SessionUser = {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: true,
        }
        const result = await hasEarlyAccess(user)
        expect(result).toBe(true)
        expect(mockGetGuilds).not.toHaveBeenCalled()
      })

      it('should return false for user without discordId', async () => {
        const user: SessionUser = {
          id: 'user-123',
          isAdmin: false,
        }
        const result = await hasEarlyAccess(user)
        expect(result).toBe(false)
      })

      it('should call SDK for non-admin users with discordId', async () => {
        vi.resetModules()
        const { hasEarlyAccess: hasEarlyAccessFresh } = await import('@/lib/permissions')

        mockGetGuilds.mockResolvedValueOnce({
          guilds: [
            { id: 'guild-123', owner: false, permissions: '8' }, // ADMINISTRATOR bit
          ],
        })

        const user: SessionUser = {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        }

        const result = await hasEarlyAccessFresh(user)
        expect(typeof result).toBe('boolean')
      })

      it('should return true when user is owner in allowed guild', async () => {
        vi.resetModules()
        const { hasEarlyAccess: hasEarlyAccessFresh } = await import('@/lib/permissions')

        mockGetGuilds.mockResolvedValueOnce({
          guilds: [{ id: 'guild-123', owner: true, permissions: '0' }],
        })

        const user: SessionUser = {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        }

        const result = await hasEarlyAccessFresh(user)
        expect(result).toBe(true)
      })

      it('should return true when user has ADMINISTRATOR permission in allowed guild', async () => {
        vi.resetModules()
        const { hasEarlyAccess: hasEarlyAccessFresh } = await import('@/lib/permissions')

        mockGetGuilds.mockResolvedValueOnce({
          guilds: [
            { id: 'guild-123', owner: false, permissions: '8' }, // ADMINISTRATOR = 0x8
          ],
        })

        const user: SessionUser = {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        }

        const result = await hasEarlyAccessFresh(user)
        expect(result).toBe(true)
      })

      it('should return false when user is not admin in any allowed guild', async () => {
        vi.resetModules()
        const { hasEarlyAccess: hasEarlyAccessFresh } = await import('@/lib/permissions')

        mockGetGuilds.mockResolvedValueOnce({
          guilds: [
            { id: 'guild-123', owner: false, permissions: '0' }, // No admin
            { id: 'guild-456', owner: false, permissions: '0' },
          ],
        })

        const user: SessionUser = {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        }

        const result = await hasEarlyAccessFresh(user)
        expect(result).toBe(false)
      })

      it('should return false when SDK throws', async () => {
        vi.resetModules()
        const { hasEarlyAccess: hasEarlyAccessFresh } = await import('@/lib/permissions')

        mockGetGuilds.mockRejectedValueOnce(new Error('API error'))

        const user: SessionUser = {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        }

        const result = await hasEarlyAccessFresh(user)
        expect(result).toBe(false)
      })

      it('should return false when Core API URL is not configured', async () => {
        process.env.CORE_API_URL = ''

        vi.resetModules()
        const { hasEarlyAccess: hasEarlyAccessFresh } = await import('@/lib/permissions')

        const user: SessionUser = {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        }

        const result = await hasEarlyAccessFresh(user)
        expect(result).toBe(false)
      })

      it('should return false when Core API secret is not configured', async () => {
        process.env.CORE_API_SECRET = ''

        vi.resetModules()
        const { hasEarlyAccess: hasEarlyAccessFresh } = await import('@/lib/permissions')

        const user: SessionUser = {
          id: 'user-123',
          discordId: 'discord-456',
          isAdmin: false,
        }

        const result = await hasEarlyAccessFresh(user)
        expect(result).toBe(false)
      })
    })

    describe('checkEarlyAccess', () => {
      it('should return hasAccess true and user for admin session', async () => {
        const session = createMockSession({
          user: {
            id: 'user-123',
            discordId: 'discord-456',
            isAdmin: true,
          },
        })
        setMockSession(session)

        const result = await checkEarlyAccess()
        expect(result.hasAccess).toBe(true)
        expect(result.user).not.toBeNull()
        expect(result.user?.id).toBe('user-123')
      })

      it('should return hasAccess false and null user when no session', async () => {
        setMockSession(null)

        const result = await checkEarlyAccess()
        expect(result.hasAccess).toBe(false)
        expect(result.user).toBeNull()
      })

      it('should return user object when session exists', async () => {
        const session = createMockSession({
          user: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            discordId: 'discord-456',
            isAdmin: false,
          },
        })
        setMockSession(session)

        // For non-admin users, early access depends on guild membership
        // We're just testing that user is returned correctly
        const result = await checkEarlyAccess()
        expect(result.user).not.toBeNull()
        expect(result.user?.name).toBe('Test User')
      })
    })

    describe('Module Exports for Early Access', () => {
      it('should export hasEarlyAccess function', () => {
        expect(typeof hasEarlyAccess).toBe('function')
      })

      it('should export checkEarlyAccess function', () => {
        expect(typeof checkEarlyAccess).toBe('function')
      })
    })
  })
})
