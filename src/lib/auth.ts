/**
 * NextAuth Configuration
 */

import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { prisma } from "./db"
import { CustomPrismaAdapter } from "./prisma-adapter"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: CustomPrismaAdapter(),
  providers: [
    // ============================================
    // Primary Sign-In Provider: Discord
    // ============================================
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
        }
      },
    }),

    // ============================================
    // Other providers commented out - link in profile settings
    // ============================================
    // GitHub, Twitch, Battle.net, Steam, Fandom available via profile linking
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Add viewAsRole for owners to view site as different role
        const dbUser = await prisma.critUser.findUnique({
          where: { id: user.id },
          select: { viewAsRole: true },
        })
        session.user.viewAsRole = dbUser?.viewAsRole as any || null
      }
      return session
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
})
