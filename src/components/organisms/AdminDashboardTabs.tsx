'use client'

import { useState } from 'react'

interface AdminDashboardTabsProps {
  discordContent: React.ReactNode
  multiverseContent: React.ReactNode
}

type TabId = 'discord' | 'multiverse'

export function AdminDashboardTabs({
  discordContent,
  multiverseContent,
}: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('discord')

  const tabs = [
    { id: 'discord' as TabId, label: 'Discord', icon: '💬' },
    { id: 'multiverse' as TabId, label: 'Multiverse', icon: '🌌' },
  ]

  return (
    <div className="w-full" data-testid="admin-dashboard-tabs">
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
        {activeTab === 'discord' && (
          <div data-testid="tab-content-discord">
            {discordContent}
          </div>
        )}
        {activeTab === 'multiverse' && (
          <div data-testid="tab-content-multiverse">
            {multiverseContent}
          </div>
        )}
      </div>
    </div>
  )
}
