/**
 * Tests for Mock Auth Stores
 *
 * Tests the in-memory authentication stores used for testing
 * without Core API dependency.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  mockAuthStores,
  type MockUser,
  type MockAccount,
  type MockSession,
} from '@/lib/mock-auth-stores'

describe('Mock Auth Stores', () => {
  beforeEach(() => {
    // Clear all stores before each test
    mockAuthStores.clearAll()
  })

  describe('User Store', () => {
    const testUser: MockUser = {
      id: 'user-123',
      email: 'test@example.com',
      emailVerified: new Date(),
      name: 'Test User',
      image: 'https://example.com/avatar.png',
      isAdmin: false,
    }

    it('should create a user', () => {
      const result = mockAuthStores.users.create(testUser)

      expect(result).toEqual(testUser)
    })

    it('should get a user by id', () => {
      mockAuthStores.users.create(testUser)

      const result = mockAuthStores.users.get('user-123')

      expect(result).toEqual(testUser)
    })

    it('should return null for non-existent user', () => {
      const result = mockAuthStores.users.get('non-existent')

      expect(result).toBeNull()
    })

    it('should get a user by email', () => {
      mockAuthStores.users.create(testUser)

      const result = mockAuthStores.users.getByEmail('test@example.com')

      expect(result).toEqual(testUser)
    })

    it('should return null for non-existent email', () => {
      const result = mockAuthStores.users.getByEmail('unknown@example.com')

      expect(result).toBeNull()
    })

    it('should get a user by account', () => {
      mockAuthStores.users.create(testUser)
      mockAuthStores.accounts.link({
        userId: 'user-123',
        type: 'oauth',
        provider: 'discord',
        providerAccountId: 'discord-456',
      })

      const result = mockAuthStores.users.getByAccount('discord', 'discord-456')

      expect(result).toEqual(testUser)
    })

    it('should return null when account not found', () => {
      const result = mockAuthStores.users.getByAccount('discord', 'unknown')

      expect(result).toBeNull()
    })

    it('should update a user', () => {
      mockAuthStores.users.create(testUser)

      const result = mockAuthStores.users.update('user-123', {
        name: 'Updated Name',
        isAdmin: true,
      })

      expect(result?.name).toBe('Updated Name')
      expect(result?.isAdmin).toBe(true)
      expect(result?.email).toBe('test@example.com')
    })

    it('should return null when updating non-existent user', () => {
      const result = mockAuthStores.users.update('non-existent', { name: 'New' })

      expect(result).toBeNull()
    })

    it('should delete a user', () => {
      mockAuthStores.users.create(testUser)
      expect(mockAuthStores.users.get('user-123')).not.toBeNull()

      mockAuthStores.users.delete('user-123')

      expect(mockAuthStores.users.get('user-123')).toBeNull()
    })
  })

  describe('Account Store', () => {
    const testAccount: MockAccount = {
      userId: 'user-123',
      type: 'oauth',
      provider: 'discord',
      providerAccountId: 'discord-456',
      access_token: 'test-token',
      token_type: 'Bearer',
      scope: 'identify email',
    }

    it('should link an account', () => {
      const result = mockAuthStores.accounts.link(testAccount)

      expect(result).toEqual(testAccount)
    })

    it('should unlink an account', () => {
      mockAuthStores.users.create({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: null,
        name: 'Test',
        image: null,
      })
      mockAuthStores.accounts.link(testAccount)

      // Verify account exists
      expect(mockAuthStores.users.getByAccount('discord', 'discord-456')).not.toBeNull()

      mockAuthStores.accounts.unlink('discord', 'discord-456')

      // Verify account is unlinked
      expect(mockAuthStores.users.getByAccount('discord', 'discord-456')).toBeNull()
    })
  })

  describe('Session Store', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const pastDate = new Date(Date.now() - 1000)

    const testSession: MockSession = {
      sessionToken: 'session-token-123',
      userId: 'user-123',
      expires: futureDate,
    }

    const testUser: MockUser = {
      id: 'user-123',
      email: 'test@example.com',
      emailVerified: null,
      name: 'Test User',
      image: null,
      isAdmin: true,
    }

    it('should create a session', () => {
      const result = mockAuthStores.sessions.create(testSession)

      expect(result).toEqual(testSession)
    })

    it('should get a valid session', () => {
      mockAuthStores.sessions.create(testSession)

      const result = mockAuthStores.sessions.get('session-token-123')

      expect(result).toEqual(testSession)
    })

    it('should return null for expired session', () => {
      mockAuthStores.sessions.create({
        ...testSession,
        expires: pastDate,
      })

      const result = mockAuthStores.sessions.get('session-token-123')

      expect(result).toBeNull()
    })

    it('should return null for non-existent session', () => {
      const result = mockAuthStores.sessions.get('non-existent')

      expect(result).toBeNull()
    })

    it('should get session with user', () => {
      mockAuthStores.users.create(testUser)
      mockAuthStores.sessions.create(testSession)

      const result = mockAuthStores.sessions.getWithUser('session-token-123')

      expect(result).not.toBeNull()
      expect(result?.session).toEqual(testSession)
      expect(result?.user).toEqual(testUser)
    })

    it('should return null when getting session with user for expired session', () => {
      mockAuthStores.users.create(testUser)
      mockAuthStores.sessions.create({
        ...testSession,
        expires: pastDate,
      })

      const result = mockAuthStores.sessions.getWithUser('session-token-123')

      expect(result).toBeNull()
    })

    it('should return null when getting session with user but user not found', () => {
      mockAuthStores.sessions.create(testSession)

      const result = mockAuthStores.sessions.getWithUser('session-token-123')

      expect(result).toBeNull()
    })

    it('should update a session', () => {
      mockAuthStores.sessions.create(testSession)
      const newExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000)

      const result = mockAuthStores.sessions.update('session-token-123', {
        expires: newExpiry,
      })

      expect(result?.expires).toEqual(newExpiry)
    })

    it('should return null when updating non-existent session', () => {
      const result = mockAuthStores.sessions.update('non-existent', {
        expires: new Date(),
      })

      expect(result).toBeNull()
    })

    it('should delete a session', () => {
      mockAuthStores.sessions.create(testSession)
      expect(mockAuthStores.sessions.get('session-token-123')).not.toBeNull()

      mockAuthStores.sessions.delete('session-token-123')

      expect(mockAuthStores.sessions.get('session-token-123')).toBeNull()
    })
  })

  describe('clearAll', () => {
    it('should clear all stores', () => {
      // Populate stores
      mockAuthStores.users.create({
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: null,
        name: 'Test',
        image: null,
      })
      mockAuthStores.accounts.link({
        userId: 'user-1',
        type: 'oauth',
        provider: 'discord',
        providerAccountId: 'discord-1',
      })
      mockAuthStores.sessions.create({
        sessionToken: 'token-1',
        userId: 'user-1',
        expires: new Date(Date.now() + 10000),
      })

      // Verify data exists
      expect(mockAuthStores.users.get('user-1')).not.toBeNull()
      expect(mockAuthStores.sessions.get('token-1')).not.toBeNull()

      // Clear all
      mockAuthStores.clearAll()

      // Verify all cleared
      expect(mockAuthStores.users.get('user-1')).toBeNull()
      expect(mockAuthStores.sessions.get('token-1')).toBeNull()
    })
  })

  describe('Module Exports', () => {
    it('should export mockAuthStores object', () => {
      expect(mockAuthStores).toBeDefined()
      expect(typeof mockAuthStores.users).toBe('object')
      expect(typeof mockAuthStores.accounts).toBe('object')
      expect(typeof mockAuthStores.sessions).toBe('object')
      expect(typeof mockAuthStores.clearAll).toBe('function')
    })
  })
})
