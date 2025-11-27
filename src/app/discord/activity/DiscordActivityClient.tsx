'use client'

import { useEffect, useState } from 'react'
import { DiscordSDK } from '@discord/embedded-app-sdk'

/**
 * Discord Activity Client Component
 *
 * This page is designed to be embedded as a Discord Activity in voice channels.
 * Integrates with Discord Embedded App SDK to authenticate users and get Discord context.
 *
 * For Discord Activities to work, the page must:
 * 1. Be served over HTTPS
 * 2. Have proper CSP headers allowing Discord to iframe it (configured in next.config.js)
 * 3. Be registered in the Discord Developer Portal as an Activity
 * 4. Have NEXT_PUBLIC_DISCORD_CLIENT_ID set in environment variables
 */

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  global_name: string | null
}

interface DiscordAuth {
  access_token: string
  user: DiscordUser
  scopes: string[]
  expires: string
}

interface CritUser {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  roles: string[]
  isOwner: boolean
  tier: string
}

interface UserStatus {
  isLinked: boolean
  user: CritUser | null
  error?: string
}

export function DiscordActivityClient() {
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [discordSdk, setDiscordSdk] = useState<DiscordSDK | null>(null)
  const [auth, setAuth] = useState<DiscordAuth | null>(null)
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [showConsent, setShowConsent] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we're running inside Discord's iframe
    const embedded = typeof window !== 'undefined' && window.parent !== window
    setIsEmbedded(embedded)

    // Only initialize SDK if we're embedded in Discord
    if (!embedded) {
      setIsLoading(false)
      return
    }

    const initializeDiscordSdk = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID

        if (!clientId) {
          setError('Discord Client ID not configured')
          setIsLoading(false)
          return
        }

        // Initialize Discord SDK
        const sdk = new DiscordSDK(clientId)
        await sdk.ready()

        setDiscordSdk(sdk)

        // Authenticate with Discord
        const { code } = await sdk.commands.authorize({
          client_id: clientId,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: [
            'identify',
            'guilds',
          ],
        })

        // Exchange code for access token
        const response = await fetch('/api/discord/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to exchange code for token')
        }

        const authData: DiscordAuth = await response.json()
        setAuth(authData)

        // Check if Discord user has a linked CritUser account
        const statusResponse = await fetch('/api/discord/activity/user-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            discordId: authData.user.id,
          }),
        })

        if (statusResponse.ok) {
          const status: UserStatus = await statusResponse.json()
          setUserStatus(status)

          // If user is not linked, show consent screen
          if (!status.isLinked) {
            setShowConsent(true)
          }
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Discord SDK initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize Discord SDK')
        setIsLoading(false)
      }
    }

    initializeDiscordSdk()
  }, [])

  // Handle user consent and auto-registration
  const handleAcceptConsent = async () => {
    if (!auth) return

    setIsRegistering(true)
    try {
      const response = await fetch('/api/discord/activity/auto-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordId: auth.user.id,
          discordUsername: auth.user.username,
          discordAvatar: auth.user.avatar,
          displayName: auth.user.global_name || auth.user.username,
          email: null, // We don't request email scope in this flow
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create account')
      }

      const result = await response.json()

      // Update user status with newly created account
      setUserStatus({
        isLinked: true,
        user: result.user,
      })

      setShowConsent(false)
      setIsRegistering(false)
    } catch (err) {
      console.error('Error creating account:', err)
      setError(err instanceof Error ? err.message : 'Failed to create account')
      setIsRegistering(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-crit-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Connecting to Discord...</p>
        </div>
      </div>
    )
  }

  // Show consent screen for new users
  if (showConsent && auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-crit-purple-500 to-crit-purple-700 flex items-center justify-center shadow-2xl shadow-crit-purple-500/30">
            <span className="text-4xl font-display font-bold">CF</span>
          </div>

          {/* Welcome Message */}
          <h2 className="text-2xl font-display font-bold text-center mb-2">
            Welcome to Crit-Fumble Gaming!
          </h2>
          <p className="text-center text-white/60 mb-6">
            Hey {auth.user.global_name || auth.user.username}! 👋
          </p>

          {/* Account Info */}
          <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              {auth.user.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png?size=64`}
                  alt={auth.user.username}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-crit-purple-500 flex items-center justify-center">
                  <span className="text-lg font-bold">{auth.user.username[0]}</span>
                </div>
              )}
              <div>
                <p className="font-semibold">{auth.user.global_name || auth.user.username}</p>
                <p className="text-sm text-white/50">@{auth.user.username}</p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="space-y-3 mb-6 text-sm text-white/70">
            <p>
              To use Crit-Fumble Gaming, we&apos;ll create a free account for you using your Discord profile.
            </p>
            <p>
              Your account will be used to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Save your gameplay sessions and preferences</li>
              <li>Track dice rolls and game state</li>
              <li>Enable multiplayer features with your party</li>
              <li>Access the virtual tabletop and tools</li>
            </ul>
            <p className="text-xs text-white/50 mt-4">
              We will never sell your data. You can delete your account anytime at{' '}
              <a
                href="https://www.crit-fumble.com/account/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-crit-purple-300 hover:text-crit-purple-200 underline"
              >
                crit-fumble.com
              </a>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAcceptConsent}
              disabled={isRegistering}
              className="w-full px-6 py-3 bg-gradient-to-r from-crit-purple-600 to-crit-purple-700 hover:from-crit-purple-700 hover:to-crit-purple-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all shadow-lg shadow-crit-purple-500/20"
            >
              {isRegistering ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </span>
              ) : (
                'Continue & Create Account'
              )}
            </button>
            <p className="text-xs text-center text-white/40">
              By continuing, you agree to our{' '}
              <a
                href="https://www.crit-fumble.com/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-crit-purple-300 hover:text-crit-purple-200 underline"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="https://www.crit-fumble.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-crit-purple-300 hover:text-crit-purple-200 underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-white/60 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-crit-purple-600 hover:bg-crit-purple-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-crit-purple-600/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-lg font-bold">CF</span>
          </div>
          <h1 className="text-lg font-display font-bold">Crit-Fumble</h1>
        </div>

        {/* User Info */}
        {auth && (
          <div className="flex items-center gap-2">
            {auth.user.avatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png?size=32`}
                alt={auth.user.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-crit-purple-500 flex items-center justify-center">
                <span className="text-sm font-bold">{auth.user.username[0]}</span>
              </div>
            )}
            <span className="text-sm hidden sm:inline">
              {auth.user.global_name || auth.user.username}
            </span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          {/* Logo/Icon */}
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-crit-purple-500 to-crit-purple-700 flex items-center justify-center shadow-2xl shadow-crit-purple-500/30">
            <span className="text-5xl font-display font-bold">CF</span>
          </div>

          {/* Welcome Message */}
          {auth ? (
            <>
              <h2 className="text-3xl font-display font-bold mb-2">
                Welcome, {userStatus?.user?.displayName || auth.user.global_name || auth.user.username}! 👋
              </h2>
              <div className="flex items-center justify-center gap-2 mb-4">
                <p className="text-crit-purple-200">
                  You&apos;re connected to Discord
                </p>
                {userStatus?.isLinked && userStatus.user?.isOwner && (
                  <span className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-xs font-semibold text-yellow-300">
                    Owner
                  </span>
                )}
              </div>
              {userStatus?.isLinked && userStatus.user && (
                <p className="text-sm text-white/50 mb-2">
                  Account: @{userStatus.user.username}
                  {userStatus.user.tier !== 'FREE' && (
                    <span className="ml-2 px-2 py-0.5 bg-crit-purple-500/20 border border-crit-purple-500/30 rounded text-xs text-crit-purple-300">
                      {userStatus.user.tier}
                    </span>
                  )}
                </p>
              )}
            </>
          ) : (
            <h2 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Coming Soon
            </h2>
          )}

          <p className="text-xl text-crit-purple-200 mb-2">
            March 2026
          </p>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Your virtual tabletop companion is being forged. Roll dice, track initiative,
            set the mood, and share notes - all directly in your Discord voice channel.
          </p>

          {/* Feature Preview */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <FeaturePreview icon="🎲" title="Dice Roller" />
            <FeaturePreview icon="📋" title="Initiative" />
            <FeaturePreview icon="🎵" title="Ambiance" />
            <FeaturePreview icon="📜" title="Notes" />
          </div>

          {/* Discord Badge */}
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-white/40">
            <svg className="w-5 h-5" viewBox="0 0 71 55" fill="currentColor">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4824 44.2898 53.5495 44.3433C53.9049 44.6363 54.2772 44.9293 54.6522 45.2082C54.7809 45.304 54.7725 45.5041 54.6326 45.5858C52.8639 46.6197 51.0251 47.4931 49.0913 48.2228C48.9654 48.2707 48.9094 48.4172 48.971 48.5383C50.0374 50.6034 51.2548 52.5699 52.595 54.435C52.6511 54.5139 52.7518 54.5477 52.8442 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.8999 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.8999 37.3253 47.3178 37.3253Z" />
            </svg>
            <span>Discord Activity</span>
            {isEmbedded && <span className="text-green-400">• Connected</span>}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 text-center text-xs text-white/30">
        <a
          href="https://www.crit-fumble.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/60 transition-colors"
        >
          www.crit-fumble.com
        </a>
      </footer>
    </div>
  )
}

function FeaturePreview({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-sm font-medium text-white/80">{title}</h3>
    </div>
  )
}
