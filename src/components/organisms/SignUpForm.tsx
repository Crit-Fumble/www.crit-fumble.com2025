'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  type LinkedAccount,
  getAccountAvatarUrl,
  getProviderDisplayName,
  getProviderBrand,
} from '@/lib/linked-accounts'

interface SignUpFormProps {
  userId: string
  defaultUsername: string
  defaultEmail: string
  defaultAvatarUrl?: string
  linkedAccounts: LinkedAccount[]
}

const AVAILABLE_PROVIDERS = ['discord', 'github', 'twitch']

export function SignUpForm({
  userId,
  defaultUsername,
  defaultEmail,
  defaultAvatarUrl,
  linkedAccounts,
}: SignUpFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState(defaultUsername)
  const [email, setEmail] = useState(defaultEmail)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    defaultAvatarUrl || null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null)

  // Get suggested avatars from linked accounts
  const suggestedAvatars = linkedAccounts
    .map((account) => {
      const avatarUrl = getAccountAvatarUrl(account)
      if (!avatarUrl) return null
      return {
        url: avatarUrl,
        provider: account.provider,
        label: `${getProviderDisplayName(account.provider)} Avatar`,
      }
    })
    .filter(Boolean) as Array<{ url: string; provider: string; label: string }>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/user/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email: email || null,
          avatarUrl: selectedAvatar,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete profile')
      }

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  const handleLinkAccount = async (provider: string) => {
    setLinkingProvider(provider)
    // Use NextAuth signIn to link a new account
    // The callbackUrl will return to this page after linking
    await signIn(provider, { callbackUrl: '/signup' })
  }

  const isProviderLinked = (provider: string) => {
    return linkedAccounts.some((acc) => acc.provider === provider)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Username <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_-]+"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-crit-purple-500 focus:border-transparent"
          placeholder="Enter your username"
          data-testid="username-input"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Letters, numbers, hyphens, and underscores only. 3-30 characters.
        </p>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Email (Optional)
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-crit-purple-500 focus:border-transparent"
          placeholder="your@email.com"
          data-testid="email-input"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Used for notifications and account recovery.
        </p>
      </div>

      {/* Avatar Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Choose Avatar (Optional)
        </label>

        {suggestedAvatars.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* No avatar option */}
            <button
              type="button"
              onClick={() => setSelectedAvatar(null)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                selectedAvatar === null
                  ? 'border-crit-purple-500 bg-crit-purple-50 dark:bg-crit-purple-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                No Avatar
              </span>
            </button>

            {/* Provider avatars */}
            {suggestedAvatars.map((avatar, index) => {
              const brand = getProviderBrand(avatar.provider)
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.url)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedAvatar === avatar.url
                      ? 'border-crit-purple-500 bg-crit-purple-50 dark:bg-crit-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label}
                    className="w-16 h-16 rounded-full"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {avatar.label}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Link an account below to use their avatar, or continue without an avatar.
          </p>
        )}
      </div>

      {/* Link Additional Accounts */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Link Additional Accounts (Optional)
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Link more accounts to have multiple sign-in options and access more avatars.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {AVAILABLE_PROVIDERS.map((provider) => {
            const brand = getProviderBrand(provider)
            const isLinked = isProviderLinked(provider)

            return (
              <button
                key={provider}
                type="button"
                onClick={() => !isLinked && handleLinkAccount(provider)}
                disabled={isLinked || linkingProvider === provider}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLinked
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : linkingProvider === provider
                    ? 'opacity-50 cursor-wait'
                    : 'text-white hover:opacity-90'
                }`}
                style={
                  !isLinked
                    ? {
                        backgroundColor: brand.color,
                      }
                    : undefined
                }
              >
                {isLinked ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {getProviderDisplayName(provider)}
                  </>
                ) : linkingProvider === provider ? (
                  'Linking...'
                ) : (
                  `Link ${getProviderDisplayName(provider)}`
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !username}
          className="w-full py-3 px-4 bg-crit-purple-600 hover:bg-crit-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="complete-profile-button"
        >
          {isSubmitting ? 'Completing Profile...' : 'Complete Profile & Continue'}
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        You can always change these settings later in your account page.
      </p>
    </form>
  )
}
