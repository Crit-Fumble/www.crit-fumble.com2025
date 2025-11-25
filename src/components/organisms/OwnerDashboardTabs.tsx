'use client'

import { useState } from 'react'
import { RpgSystemsManagement } from './RpgSystemsManagement'

interface FoundryGameSystem {
  id: string
  systemId: string
  name: string
  title: string
  manifestUrl: string
  version: string
  description: string | null
  author: string | null
  url: string | null
  download: string | null
  isEnabled: boolean
  isCore: boolean
  priority: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface OwnerDashboardTabsProps {
  gameSystems: FoundryGameSystem[]
}

type TabId = 'systems' | 'concepts'

export function OwnerDashboardTabs({ gameSystems }: OwnerDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('systems')

  const tabs = [
    { id: 'systems' as TabId, label: 'Game Systems', icon: '🎮' },
    { id: 'concepts' as TabId, label: 'Core Concepts', icon: '📖' },
  ]

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 bg-white dark:bg-gray-800 rounded-t-lg">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'systems' && (
          <div>
            <RpgSystemsManagement initialSystems={gameSystems} />
          </div>
        )}
        {activeTab === 'concepts' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Core Concepts
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This feature is not yet available.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
