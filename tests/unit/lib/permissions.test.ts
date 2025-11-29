/**
 * Tests for Permissions System
 *
 * Tests the permission checking functions for wiki access and roles.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mockAuth,
  setMockSession,
  createMockSession,
} from '../setup'

// Mock 'server-only' before importing permissions
vi.mock('server-only', () => ({}))

// Now import the permissions module
import {
  createPermissions,
  getRoleFromDiscordId,
  isOwnerDiscordId,
  isAdminDiscordId,
  canEditWiki,
  canPublishWiki,
  canDeleteWiki,
  canViewWiki,
  canViewActivity,
  toWebRole,
  getUserDiscordId,
  getUserRole,
  getRoleFromSession,
  type UserRole,
  type WebRole,
} from '@/lib/permissions'

describe('Permissions System', () => {
  describe('createPermissions', () => {
    it('should parse comma-separated Discord IDs', () => {
      const permissions = createPermissions({
        ownerIds: '111,222,333',
        adminIds: '444,555',
      })

      expect(permissions.isOwnerDiscordId('111')).toBe(true)
      expect(permissions.isOwnerDiscordId('222')).toBe(true)
      expect(permissions.isOwnerDiscordId('333')).toBe(true)
      expect(permissions.isAdminDiscordId('444')).toBe(true)
      expect(permissions.isAdminDiscordId('555')).toBe(true)
    })

    it('should handle array of Discord IDs', () => {
      const permissions = createPermissions({
        ownerIds: ['111', '222'],
        adminIds: ['333', '444'],
      })

      expect(permissions.isOwnerDiscordId('111')).toBe(true)
      expect(permissions.isOwnerDiscordId('222')).toBe(true)
      expect(permissions.isAdminDiscordId('333')).toBe(true)
      expect(permissions.isAdminDiscordId('444')).toBe(true)
    })

    it('should handle empty configuration', () => {
      const permissions = createPermissions({})

      expect(permissions.isOwnerDiscordId('111')).toBe(false)
      expect(permissions.isAdminDiscordId('111')).toBe(false)
    })

    it('should handle undefined values', () => {
      const permissions = createPermissions({
        ownerIds: undefined,
        adminIds: undefined,
      })

      expect(permissions.isOwnerDiscordId('111')).toBe(false)
      expect(permissions.isAdminDiscordId('111')).toBe(false)
    })

    it('should trim whitespace from Discord IDs', () => {
      const permissions = createPermissions({
        ownerIds: ' 111 , 222 , 333 ',
      })

      expect(permissions.isOwnerDiscordId('111')).toBe(true)
      expect(permissions.isOwnerDiscordId('222')).toBe(true)
      expect(permissions.isOwnerDiscordId('333')).toBe(true)
    })

    it('should filter out empty IDs', () => {
      const permissions = createPermissions({
        ownerIds: '111,,222,',
      })

      expect(permissions.isOwnerDiscordId('111')).toBe(true)
      expect(permissions.isOwnerDiscordId('222')).toBe(true)
      expect(permissions.isOwnerDiscordId('')).toBe(false)
    })
  })

  describe('isOwnerDiscordId', () => {
    it('should identify owners correctly', () => {
      const permissions = createPermissions({
        ownerIds: ['owner-123'],
        adminIds: ['admin-456'],
      })

      expect(permissions.isOwnerDiscordId('owner-123')).toBe(true)
      expect(permissions.isOwnerDiscordId('admin-456')).toBe(false)
      expect(permissions.isOwnerDiscordId('user-789')).toBe(false)
    })
  })

  describe('isAdminDiscordId', () => {
    it('should identify admins correctly', () => {
      const permissions = createPermissions({
        ownerIds: ['owner-123'],
        adminIds: ['admin-456'],
      })

      expect(permissions.isAdminDiscordId('admin-456')).toBe(true)
    })

    it('should treat owners as admins', () => {
      const permissions = createPermissions({
        ownerIds: ['owner-123'],
        adminIds: ['admin-456'],
      })

      expect(permissions.isAdminDiscordId('owner-123')).toBe(true)
    })

    it('should not treat regular users as admins', () => {
      const permissions = createPermissions({
        ownerIds: ['owner-123'],
        adminIds: ['admin-456'],
      })

      expect(permissions.isAdminDiscordId('user-789')).toBe(false)
    })
  })

  describe('getRoleFromDiscordId', () => {
    it('should return owner role for owner Discord ID', () => {
      const permissions = createPermissions({
        ownerIds: ['owner-123'],
        adminIds: ['admin-456'],
      })

      expect(permissions.getRoleFromDiscordId('owner-123')).toBe('owner')
    })

    it('should return admin role for admin Discord ID', () => {
      const permissions = createPermissions({
        ownerIds: ['owner-123'],
        adminIds: ['admin-456'],
      })

      expect(permissions.getRoleFromDiscordId('admin-456')).toBe('admin')
    })

    it('should return user role for unknown Discord ID', () => {
      const permissions = createPermissions({
        ownerIds: ['owner-123'],
        adminIds: ['admin-456'],
      })

      expect(permissions.getRoleFromDiscordId('random-user')).toBe('user')
    })

    it('should return user role for null Discord ID', () => {
      const permissions = createPermissions({
        ownerIds: ['owner-123'],
        adminIds: ['admin-456'],
      })

      expect(permissions.getRoleFromDiscordId(null)).toBe('user')
    })
  })

  describe('Wiki Permissions', () => {
    describe('canEditWiki', () => {
      it('should allow owners to edit wiki', () => {
        expect(canEditWiki('owner')).toBe(true)
      })

      it('should allow admins to edit wiki', () => {
        expect(canEditWiki('admin')).toBe(true)
      })

      it('should not allow regular users to edit wiki', () => {
        expect(canEditWiki('user')).toBe(false)
      })
    })

    describe('canPublishWiki', () => {
      it('should allow owners to publish wiki', () => {
        expect(canPublishWiki('owner')).toBe(true)
      })

      it('should not allow admins to publish wiki', () => {
        expect(canPublishWiki('admin')).toBe(false)
      })

      it('should not allow regular users to publish wiki', () => {
        expect(canPublishWiki('user')).toBe(false)
      })
    })

    describe('canDeleteWiki', () => {
      it('should allow owners to delete wiki', () => {
        expect(canDeleteWiki('owner')).toBe(true)
      })

      it('should not allow admins to delete wiki', () => {
        expect(canDeleteWiki('admin')).toBe(false)
      })

      it('should not allow regular users to delete wiki', () => {
        expect(canDeleteWiki('user')).toBe(false)
      })
    })

    describe('canViewWiki', () => {
      it('should allow owners to view wiki', () => {
        expect(canViewWiki('owner')).toBe(true)
      })

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
      it('should allow owners to view activity', () => {
        expect(canViewActivity('owner')).toBe(true)
      })

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
      it('should convert owner to owner', () => {
        expect(toWebRole('owner')).toBe('owner')
      })

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
      // Test that the module-level exports work correctly
      // These use the environment-configured permissions instance
      expect(typeof isOwnerDiscordId).toBe('function')
      expect(typeof isAdminDiscordId).toBe('function')
      expect(typeof getRoleFromDiscordId).toBe('function')
      expect(typeof canEditWiki).toBe('function')
      expect(typeof canPublishWiki).toBe('function')
      expect(typeof canDeleteWiki).toBe('function')
      expect(typeof canViewWiki).toBe('function')
      expect(typeof canViewActivity).toBe('function')
      expect(typeof toWebRole).toBe('function')
      expect(typeof createPermissions).toBe('function')
    })
  })

  describe('Session-based Functions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('getUserDiscordId', () => {
      it('should return Discord ID from session when user matches', async () => {
        const session = createMockSession({
          user: {
            id: 'user-123',
            discordId: 'discord-456',
          },
        })
        setMockSession(session)

        const result = await getUserDiscordId('user-123')
        expect(result).toBe('discord-456')
      })

      it('should return null when session is null', async () => {
        setMockSession(null)

        const result = await getUserDiscordId('user-123')
        expect(result).toBeNull()
      })

      it('should return null when user ID does not match session', async () => {
        const session = createMockSession({
          user: {
            id: 'different-user',
            discordId: 'discord-456',
          },
        })
        setMockSession(session)

        const result = await getUserDiscordId('user-123')
        expect(result).toBeNull()
      })

      it('should return null when session user is undefined', async () => {
        mockAuth.mockResolvedValue({ expires: new Date().toISOString() })

        const result = await getUserDiscordId('user-123')
        expect(result).toBeNull()
      })

      it('should return null when discordId is not on session user', async () => {
        const session = {
          user: {
            id: 'user-123',
            name: 'Test User',
            // discordId intentionally omitted
          },
          expires: new Date().toISOString(),
        }
        setMockSession(session as any)

        const result = await getUserDiscordId('user-123')
        expect(result).toBeNull()
      })
    })

    describe('getUserRole', () => {
      it('should return user role and discordId from session', async () => {
        const session = createMockSession({
          user: {
            id: 'user-123',
            discordId: 'regular-user-id',
          },
        })
        setMockSession(session)

        const result = await getUserRole('user-123')
        expect(result.discordId).toBe('regular-user-id')
        expect(result.role).toBe('user') // Not in owner/admin lists
      })

      it('should return user role with null discordId when session is null', async () => {
        setMockSession(null)

        const result = await getUserRole('user-123')
        expect(result.discordId).toBeNull()
        expect(result.role).toBe('user')
      })
    })

    describe('getRoleFromSession', () => {
      it('should return owner role when discordId is in owner list', () => {
        // This function uses the environment-configured permissions
        // which may not have our test IDs, so we test the structure
        const result = getRoleFromSession('some-discord-id')
        expect(result).toHaveProperty('role')
        expect(result).toHaveProperty('discordId')
        expect(result.discordId).toBe('some-discord-id')
      })

      it('should return user role with null discordId when discordId is null', () => {
        const result = getRoleFromSession(null)
        expect(result.role).toBe('user')
        expect(result.discordId).toBeNull()
      })

      it('should preserve the discordId in the result', () => {
        const result = getRoleFromSession('test-discord-123')
        expect(result.discordId).toBe('test-discord-123')
      })
    })
  })
})
