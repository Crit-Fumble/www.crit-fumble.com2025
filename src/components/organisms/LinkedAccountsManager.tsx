'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  type LinkedAccount,
  getAccountDisplayName,
  getAccountAvatarUrl,
  getProviderDisplayName,
  getProviderBrand,
} from '@/lib/linked-accounts'

interface LinkedAccountsManagerProps {
  accounts: LinkedAccount[]
  primaryAccountId?: string | null
}

const AVAILABLE_PROVIDERS = [
  { id: 'discord', name: 'Discord', description: 'Join our community server' },
  { id: 'github', name: 'GitHub', description: 'Easy authentication with GitHub' },
  { id: 'twitch', name: 'Twitch', description: 'Join our streaming community' },
]

export function LinkedAccountsManager({
  accounts,
  primaryAccountId,
}: LinkedAccountsManagerProps) {
  const router = useRouter()
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUnlink = async (accountId: string) => {
    if (!confirm('Are you sure you want to unlink this account?')) {
      return
    }

    setUnlinkingId(accountId)
    setError(null)

    try {
      const res = await fetch(`/api/user/accounts/${accountId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlink account')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUnlinkingId(null)
    }
  }

  const handleSetPrimary = async (accountId: string) => {
    setSettingPrimary(accountId)
    setError(null)

    try {
      const res = await fetch('/api/user/accounts/primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to set primary account')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSettingPrimary(null)
    }
  }

  const handleLink = async (provider: string) => {
    // Use NextAuth signIn to link a new account
    // The callbackUrl will return to this page after linking
    await signIn(provider, { callbackUrl: '/account' })
  }

  const getLinkedAccountsByProvider = (provider: string) => {
    return accounts.filter((acc) => acc.provider === provider)
  }

  const isProviderLinked = (provider: string) => {
    return getLinkedAccountsByProvider(provider).length > 0
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {AVAILABLE_PROVIDERS.map((provider) => {
        const linkedAccounts = getLinkedAccountsByProvider(provider.id)
        const brand = getProviderBrand(provider.id)

        return (
          <div
            key={provider.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            data-testid={`${provider.id}-account`}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: brand.color + '20' }}
              >
                <ProviderIcon provider={provider.id} color={brand.color} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {provider.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {provider.description}
                </p>

                {/* Linked accounts list */}
                {linkedAccounts.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {linkedAccounts.map((account) => {
                      const displayName = getAccountDisplayName(account)
                      const avatarUrl = getAccountAvatarUrl(account)
                      const isPrimary = account.id === primaryAccountId

                      return (
                        <div
                          key={account.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isPrimary
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {avatarUrl && (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {displayName}
                            </p>
                            {isPrimary && (
                              <p className="text-xs text-green-600 dark:text-green-400">
                                Primary account
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!isPrimary && (
                              <button
                                onClick={() => handleSetPrimary(account.id)}
                                disabled={settingPrimary === account.id}
                                className="text-xs px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                              >
                                {settingPrimary === account.id
                                  ? 'Setting...'
                                  : 'Set as Primary'}
                              </button>
                            )}

                            {accounts.length > 1 && (
                              <button
                                onClick={() => handleUnlink(account.id)}
                                disabled={unlinkingId === account.id}
                                className="text-xs px-3 py-1 rounded-md bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 transition-colors disabled:opacity-50"
                              >
                                {unlinkingId === account.id
                                  ? 'Unlinking...'
                                  : 'Unlink'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                {linkedAccounts.length > 0 ? (
                  <button
                    onClick={() => handleLink(provider.id)}
                    className="text-sm px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Link Another
                  </button>
                ) : (
                  <button
                    onClick={() => handleLink(provider.id)}
                    className="px-4 py-2 rounded-md text-white font-medium transition-colors"
                    style={{
                      backgroundColor: brand.color,
                    }}
                  >
                    Link Account
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex gap-3">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              About Linked Accounts
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You can link multiple accounts from the same or different providers. Your internal
              user ID stays the same regardless of which account you use to sign in. Set a primary
              account to control which username and avatar are displayed. You must have at least
              one linked account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProviderIcon({ provider, color }: { provider: string; color: string }) {
  const className = 'w-6 h-6'
  const style = { color }

  switch (provider) {
    case 'discord':
      return (
        <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
        </svg>
      )
    case 'github':
      return (
        <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'twitch':
      return (
        <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
        </svg>
      )
    default:
      return null
  }
}
