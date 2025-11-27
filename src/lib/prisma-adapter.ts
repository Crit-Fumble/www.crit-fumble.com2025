/**
 * Custom Prisma Adapter for NextAuth
 * Adds session activity tracking and uses CritUser model
 */

import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"
import type { Adapter } from "next-auth/adapters"

export function CustomPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma) as Adapter

  return {
    ...baseAdapter,

    // Override getUserByEmail to use CritUser model
    async getUserByEmail(email) {
      const user = await prisma.critUser.findUnique({
        where: { email },
      })

      if (!user) return null

      return {
        id: user.id,
        name: user.username,
        email: user.email || '',
        emailVerified: null,
      }
    },

    // Override getUser to use CritUser model
    async getUser(id) {
      const user = await prisma.critUser.findUnique({
        where: { id },
      })

      if (!user) return null

      return {
        id: user.id,
        name: user.username,
        email: user.email || '',
        emailVerified: null,
      }
    },

    // Override createUser to use CritUser model
    async createUser(data) {
      // Generate temporary unique username (user will customize during sign-up)
      const baseUsername = data.name || data.email?.split('@')[0] || 'user'
      let username = baseUsername
      let attempts = 0
      const maxAttempts = 10

      // Try to find a unique username
      while (attempts < maxAttempts) {
        const existingUsername = await prisma.critUser.findUnique({
          where: { username },
        })

        if (!existingUsername) break

        // Username taken, try with suffix
        username = `${baseUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`
        attempts++
      }

      const user = await prisma.critUser.create({
        data: {
          id: data.id || crypto.randomUUID(),
          username,
          email: data.email,
          lastLoginAt: new Date(),
          profileCompleted: false, // Mark as incomplete - user needs to complete sign-up
        },
      })

      return {
        id: user.id,
        name: user.username,
        email: user.email || '',
        emailVerified: null,
      }
    },

    // Override linkAccount to store provider metadata
    async linkAccount(account) {
      // Extract metadata from the profile/token data
      const metadata: Record<string, any> = {}

      // Store provider-specific metadata
      if (account.provider === 'discord') {
        metadata.username = (account as any).profile?.username
        metadata.discriminator = (account as any).profile?.discriminator
        metadata.avatar = (account as any).profile?.avatar
        metadata.email = (account as any).profile?.email
        if (metadata.avatar && (account as any).profile?.id) {
          metadata.avatarUrl = `https://cdn.discordapp.com/avatars/${(account as any).profile.id}/${metadata.avatar}.png`
        }
      } else if (account.provider === 'github') {
        metadata.login = (account as any).profile?.login
        metadata.name = (account as any).profile?.name
        metadata.email = (account as any).profile?.email
        metadata.avatar_url = (account as any).profile?.avatar_url
      } else if (account.provider === 'twitch') {
        metadata.preferred_username = (account as any).profile?.preferred_username
        metadata.email = (account as any).profile?.email
        metadata.picture = (account as any).profile?.picture
      }

      // Create the account link with metadata
      const accountData = {
        ...account,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await prisma.account.create({
        data: accountData as any,
      })

      // Update CritUser login timestamp and provider fields
      try {
        const updateData: any = {
          lastLoginAt: new Date(),
        }

        if (account.provider === 'discord') {
          updateData.discordId = account.providerAccountId
          updateData.discordUsername = metadata.username
          updateData.discordAvatar = metadata.avatarUrl
        } else if (account.provider === 'github') {
          updateData.githubId = account.providerAccountId
          updateData.githubUsername = metadata.login
          updateData.githubAvatar = metadata.avatar_url
        } else if (account.provider === 'twitch') {
          updateData.twitchId = account.providerAccountId
          updateData.twitchUsername = metadata.preferred_username
          updateData.twitchAvatar = metadata.picture
        }

        await prisma.critUser.update({
          where: { id: account.userId },
          data: updateData,
        })
      } catch (error) {
        console.error('Error updating CritUser with provider info:', error)
      }

      return result
    },

    // Override updateUser to use CritUser model
    async updateUser(data) {
      const user = await prisma.critUser.update({
        where: { id: data.id },
        data: {
          username: data.name || undefined,
          email: data.email || undefined,
        },
      })

      return {
        id: user.id,
        name: user.username,
        email: user.email || '',
        emailVerified: null,
      }
    },

    // Override deleteUser to use CritUser model
    async deleteUser(id) {
      await prisma.critUser.delete({
        where: { id },
      })
    },

    // Override createSession to add activity tracking fields
    async createSession(session) {
      const createdSession = await prisma.session.create({
        data: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
          createdAt: new Date(),
          lastActivityAt: new Date(),
        },
      })

      // Create immutable audit log entry
      try {
        await prisma.critSessionLog.create({
          data: {
            playerId: session.userId,
            sessionToken: session.sessionToken,
            loginMethod: 'oauth',
            expiresAt: session.expires,
            lastActivityAt: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
            isValid: true,
          },
        })
      } catch (error) {
        console.error("Failed to create player session audit log:", error)
      }

      return {
        sessionToken: createdSession.sessionToken,
        userId: createdSession.userId,
        expires: createdSession.expires,
      }
    },

    // Override updateSession to update activity tracking
    async updateSession(session) {
      const updatedSession = await prisma.session.update({
        where: { sessionToken: session.sessionToken },
        data: {
          expires: session.expires,
          lastActivityAt: new Date(),
        },
      })

      // Update player session activity
      try {
        await prisma.critSessionLog.updateMany({
          where: {
            sessionToken: session.sessionToken,
            isValid: true,
          },
          data: {
            lastActivityAt: new Date(),
          },
        })
      } catch (error) {
        console.error("Failed to update player session activity:", error)
      }

      return {
        sessionToken: updatedSession.sessionToken,
        userId: updatedSession.userId,
        expires: updatedSession.expires,
      }
    },

    // Override deleteSession to mark as invalid in audit log
    async deleteSession(sessionToken) {
      try {
        await prisma.critSessionLog.updateMany({
          where: {
            sessionToken,
            isValid: true,
          },
          data: {
            isValid: false,
            loggedOutAt: new Date(),
          },
        })
      } catch (error) {
        console.error("Failed to mark player session as logged out:", error)
      }

      await baseAdapter.deleteSession!(sessionToken)
      return null
    },

    // Override getSessionAndUser to properly map playerId to userId
    async getSessionAndUser(sessionToken) {
      const sessionAndPlayer = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })

      if (!sessionAndPlayer) return null

      const { user: player, ...session } = sessionAndPlayer

      // Check if session is expired
      if (session.expires < new Date()) {
        return null
      }

      // Only update activity timestamp if it's been more than 5 minutes since last update
      const now = new Date()
      const lastActivity = session.lastActivityAt || session.createdAt
      const minutesSinceLastUpdate = (now.getTime() - lastActivity.getTime()) / 1000 / 60

      if (minutesSinceLastUpdate >= 5) {
        try {
          // Fire and forget - don't await to speed up requests
          prisma.session.update({
            where: { sessionToken },
            data: { lastActivityAt: now },
          }).catch(err => console.error("Failed to update session activity:", err))

          prisma.critSessionLog.updateMany({
            where: {
              sessionToken,
              isValid: true,
            },
            data: {
              lastActivityAt: now,
            },
          }).catch(err => console.error("Failed to update player session activity:", err))
        } catch (error) {
          // Ignore errors to avoid blocking requests
        }
      }

      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        },
        user: {
          id: player.id,
          name: player.username,
          email: player.email || '',
          emailVerified: null,
          profileCompleted: player.profileCompleted,
        },
      }
    },
  }
}
