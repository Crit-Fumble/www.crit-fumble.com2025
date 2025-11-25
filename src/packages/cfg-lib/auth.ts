import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
// Removed GitHub and Twitch - users can link these accounts in their profile settings
// import GitHub from "next-auth/providers/github"
// import Twitch from "next-auth/providers/twitch"
import Resend from "next-auth/providers/resend"
// import BattleNet from "next-auth/providers/battlenet" // Commented out for now
import { prisma } from "./db"
import { CustomPrismaAdapter } from "./prisma-adapter"

// Security: Validate NEXTAUTH_SECRET is set in production
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET must be set in production environment')
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CustomPrismaAdapter(),
  providers: [
    // ============================================
    // Email Authentication - Stubbed for future implementation
    // ============================================
    // Provider: Resend (https://resend.com)
    // Method: Magic link sent to email
    // Cost: Free tier: 100 emails/day, $20/month for 50k emails
    // Setup:
    //   1. Sign up at https://resend.com
    //   2. Add RESEND_API_KEY to .env
    //   3. Verify domain for production use
    // Resend({
    //   apiKey: process.env.RESEND_API_KEY!,
    //   from: process.env.RESEND_FROM_EMAIL || "noreply@crit-fumble.com",
    // }),

    // ============================================
    // Primary Sign-In Provider: Discord
    // ============================================
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
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
    // GitHub and Twitch - Removed from sign-in
    // ============================================
    // Users can link these accounts in their profile settings after signing in with Discord
    // This provides better UX and clearer primary authentication method
    //
    // GitHub({
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    //   allowDangerousEmailAccountLinking: true,
    //   profile(profile) {
    //     return {
    //       id: profile.id.toString(),
    //       name: profile.login,
    //       email: profile.email,
    //       image: profile.avatar_url,
    //     }
    //   },
    // }),
    // Twitch({
    //   clientId: process.env.TWITCH_CLIENT_ID!,
    //   clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    //   allowDangerousEmailAccountLinking: true,
    //   profile(profile) {
    //     return {
    //       id: profile.sub,
    //       name: profile.preferred_username,
    //       email: profile.email,
    //       image: profile.picture,
    //     }
    //   },
    // }),
    // ============================================
    // Battle.net - Commented out for now
    // ============================================
    // BattleNet({
    //   clientId: process.env.BATTLENET_CLIENT_ID!,
    //   clientSecret: process.env.BATTLENET_CLIENT_SECRET!,
    //   issuer: process.env.BATTLENET_ISSUER || "https://oauth.battle.net",
    //   allowDangerousEmailAccountLinking: true,
    //   profile(profile) {
    //     return {
    //       id: profile.sub,
    //       name: profile.battletag,
    //       email: profile.email,
    //       image: null, // Battle.net doesn't provide avatar in OAuth
    //     }
    //   },
    // }),

    // ============================================
    // Steam OAuth - Commented out (will add to UI later)
    // ============================================
    // Uses OpenID 2.0 (not standard OAuth)
    // Implementation: src/lib/steam-openid.ts
    // API Routes: src/app/api/auth/steam/route.ts
    // Documentation: docs/integrations/STEAM_INTEGRATION.md

    // ============================================
    // Fandom OAuth - Commented out (will add to UI later)
    // ============================================
    // Provider: Fandom (MediaWiki OAuth 2.0)
    // Documentation: docs/integrations/FANDOM_INTEGRATION.md
    // {
    //   id: "fandom",
    //   name: "Fandom",
    //   type: "oauth",
    //   authorization: {
    //     url: "https://services.fandom.com/oauth2/authorize",
    //     params: { scope: "profile" }
    //   },
    //   token: "https://services.fandom.com/oauth2/token",
    //   userinfo: "https://services.fandom.com/oauth2/userinfo",
    //   allowDangerousEmailAccountLinking: true,
    //   profile(profile) {
    //     return {
    //       id: profile.sub,
    //       name: profile.username,
    //       email: profile.email,
    //       image: null,
    //     }
    //   },
    // },
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
