'use client'

import { useState } from 'react'

interface CoreConceptsAccount {
  provider: string
  providerAccountId: string
  displayName: string | null
  metadata: Record<string, any>
  createdAt: Date
}

interface CoreConceptsInfoProps {
  playerId: string | null
  playerEmail: string | null
  playerDisplayName: string | null
  linkedAccounts: CoreConceptsAccount[]
}

export function CoreConceptsInfo({
  playerId,
  playerEmail,
  playerDisplayName,
  linkedAccounts,
}: CoreConceptsInfoProps) {
  const [copied, setCopied] = useState(false)

  const copyPlayerId = () => {
    if (playerId) {
      navigator.clipboard.writeText(playerId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6">
          Core Concepts Identity
        </h2>

        <div className="space-y-6">
          {/* Player Status */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Player Status
            </h3>

            {playerId ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Core Concepts Player ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                      {playerId}
                    </code>
                    <button
                      onClick={copyPlayerId}
                      className="px-4 py-2 bg-crit-purple-600 hover:bg-crit-purple-700 text-white rounded transition-colors"
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Use this ID to link your Core Concepts account with other integrations and platforms.
                  </p>
                </div>

                {playerDisplayName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Name
                    </label>
                    <div className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                      {playerDisplayName}
                    </div>
                  </div>
                )}

                {playerEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                      {playerEmail}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
                  <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Core Concepts Player Not Linked
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your Crit-Fumble account is not yet linked to a Core Concepts player.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  A Core Concepts player will be automatically created when you start playing games or managing campaigns.
                </p>
              </div>
            )}
          </div>

          {/* Linked Accounts in Core Concepts */}
          {linkedAccounts.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Linked Accounts in Core Concepts
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                These OAuth accounts are linked to your Core Concepts player identity and can be used to authenticate with Core Concepts.
              </p>

              <div className="space-y-3">
                {linkedAccounts.map((account, index) => {
                  const providerInfo = getProviderInfo(account.provider)
                  const username = account.displayName || getUsername(account.metadata, account.provider)

                  return (
                    <div
                      key={`${account.provider}-${account.providerAccountId}-${index}`}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                        <span className="text-2xl">{providerInfo.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {providerInfo.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {username}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Linked {new Date(account.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  About Core Concepts
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  Core Concepts is the independent RPG/game data system that powers campaigns, worlds, characters, and sessions across multiple platforms and integrations.
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your Core Concepts Player ID allows you to link your game data with other platforms like Foundry VTT, World Anvil, and more while maintaining a unified identity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get provider display info
function getProviderInfo(provider: string): { name: string; icon: string } {
  const providers: Record<string, { name: string; icon: string }> = {
    discord: { name: 'Discord', icon: '💬' },
    github: { name: 'GitHub', icon: '🐙' },
    twitch: { name: 'Twitch', icon: '📺' },
    battlenet: { name: 'Battle.net', icon: '⚔️' },
    steam: { name: 'Steam', icon: '🎮' },
    fandom: { name: 'Fandom', icon: '📚' },
    worldanvil: { name: 'World Anvil', icon: '🗺️' },
  }

  return providers[provider.toLowerCase()] || { name: provider, icon: '🔗' }
}

// Helper function to extract username from metadata
function getUsername(metadata: Record<string, any>, provider: string): string {
  if (!metadata) return 'Unknown'

  // Different providers store username in different fields
  return (
    metadata.username ||
    metadata.login ||
    metadata.preferred_username ||
    metadata.display_name ||
    metadata.name ||
    'Unknown'
  )
}
