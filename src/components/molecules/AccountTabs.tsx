'use client'

import { useState } from 'react'

interface AccountTabsProps {
  linkedAccountsContent: React.ReactNode
  profileContent?: React.ReactNode
  coreConceptsContent?: React.ReactNode
  isAdmin?: boolean
}

type TabId = 'player' | 'game-master' | 'creator' | 'core-concepts' | 'cfg-account' | 'linked-accounts'

export function AccountTabs({
  linkedAccountsContent,
  profileContent,
  coreConceptsContent,
  isAdmin = false
}: AccountTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('player')

  const allTabs = [
    { id: 'player' as TabId, label: 'Player', icon: '🎲', adminOnly: false },
    { id: 'game-master' as TabId, label: 'Game Master', icon: '🎭', adminOnly: true },
    { id: 'creator' as TabId, label: 'Creator', icon: '✨', adminOnly: true },
    { id: 'core-concepts' as TabId, label: 'Core Concepts', icon: '🌐', adminOnly: false },
    { id: 'cfg-account' as TabId, label: 'CFG Account', icon: '⚙️', adminOnly: false },
    { id: 'linked-accounts' as TabId, label: 'Linked Accounts', icon: '🔗', adminOnly: false },
  ]

  // Filter tabs based on admin status
  const tabs = allTabs.filter(tab => !tab.adminOnly || isAdmin)

  return (
    <div className="w-full" data-testid="account-tabs">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 bg-white dark:bg-gray-800 rounded-t-lg">
        <nav className="-mb-px flex space-x-8 px-6" data-testid="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-crit-purple-500 text-crit-purple-600 dark:text-crit-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
              data-testid={`tab-${tab.id}`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'player' && (
          <div data-testid="tab-content-player">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-8 py-12 sm:py-16">
              <div className="text-center">
                <svg
                  className="w-20 h-20 mx-auto mb-6 text-crit-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                  Coming Soon
                </h3>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                  Player settings, character management, and campaign preferences will be available soon.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'game-master' && (
          <div data-testid="tab-content-game-master">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-8 py-12 sm:py-16">
              <div className="text-center">
                <svg
                  className="w-20 h-20 mx-auto mb-6 text-crit-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                  Coming Soon
                </h3>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                  Game Master tools, campaign creation, and world management will be available soon.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'creator' && (
          <div data-testid="tab-content-creator">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-8 py-12 sm:py-16">
              <div className="text-center">
                <svg
                  className="w-20 h-20 mx-auto mb-6 text-crit-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                  Coming Soon
                </h3>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                  Creator marketplace, commission management, and content publishing will be available soon.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'core-concepts' && (
          <div data-testid="tab-content-core-concepts">
            {coreConceptsContent || (
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-8 py-12 sm:py-16">
                <div className="text-center">
                  <svg
                    className="w-20 h-20 mx-auto mb-6 text-crit-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                    Core Concepts Identity
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                    Your Core Concepts player identity will appear here once you start playing games or managing campaigns.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'cfg-account' && (
          <div data-testid="tab-content-cfg-account">
            {profileContent || (
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-8 py-12 sm:py-16">
                <div className="text-center">
                  <svg
                    className="w-20 h-20 mx-auto mb-6 text-crit-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                    Coming Soon
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                    Account preferences, privacy settings, and notifications will be available soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'linked-accounts' && (
          <div data-testid="tab-content-linked-accounts">
            {linkedAccountsContent}
          </div>
        )}
      </div>
    </div>
  )
}
