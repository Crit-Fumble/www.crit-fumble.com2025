'use client'

import { useState } from 'react'
import { SubTabs } from '../molecules/SubTabs'

interface User {
  id: string
  username: string | null
  email: string | null
  discordId: string | null
  githubId: string | null
  discordUsername: string | null
  githubUsername: string | null
  lastLoginAt: Date | null
  createdAt: Date
  isActive: boolean
  sessionLogs: {
    createdAt: Date
    loginMethod: string | null
  }[]
}

interface WebsiteManagementProps {
  allUsers: User[]
}

export function WebsiteManagement({ allUsers }: WebsiteManagementProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'test'>('users')

  // Filter users by email domain
  const productionUsers = allUsers.filter(u => !u.email?.endsWith('@crit-fumble.test'))
  const testUsers = allUsers.filter(u => u.email?.endsWith('@crit-fumble.test'))

  const renderUserTable = (users: User[]) => (
    <>
      {/* User Stats Summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="total-users-stat">
          <div className="text-2xl font-bold text-crit-purple-400">{users.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
        </div>
        <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="active-users-stat">
          <div className="text-2xl font-bold text-green-400">
            {users.filter(u => u.isActive).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
        </div>
        <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4" data-testid="recent-logins-stat">
          <div className="text-2xl font-bold text-blue-400">
            {users.filter(u => {
              if (!u.lastLoginAt) return false
              const daysSinceLogin = (Date.now() - new Date(u.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24)
              return daysSinceLogin <= 7
            }).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Logged in (7 days)</div>
        </div>
      </div>

      {/* User List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="user-list-table">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Username</th>
              <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Email</th>
              <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Linked Accounts</th>
              <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Last Login</th>
              <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Joined</th>
              <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const lastActivity = user.lastLoginAt || user.sessionLogs[0]?.createdAt || user.createdAt
              const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)

              return (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  data-testid={`user-row-${user.username}`}
                >
                  <td className="py-3 px-2 text-gray-900 dark:text-white font-medium">{user.username}</td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">{user.email || '—'}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      {user.discordId && (
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded text-xs" title={user.discordUsername || undefined}>
                          Discord
                        </span>
                      )}
                      {user.githubId && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs" title={user.githubUsername || undefined}>
                          GitHub
                        </span>
                      )}
                      {!user.discordId && !user.githubId && (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                    {user.lastLoginAt ? (
                      <span title={new Date(user.lastLoginAt).toLocaleString()}>
                        {daysSinceActivity < 1
                          ? 'Today'
                          : daysSinceActivity < 7
                          ? `${Math.floor(daysSinceActivity)}d ago`
                          : new Date(user.lastLoginAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2">
                    {user.isActive ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No users found
        </div>
      )}
    </>
  )

  const tabs = [
    { id: 'users', label: 'Users', count: productionUsers.length },
    { id: 'test', label: 'Test Users', count: testUsers.length },
  ]

  return (
    <div className="space-y-6">
      {/* Sub-tabs with background */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm">
        <SubTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'users' | 'test')}
        />
      </div>

      {/* User Management Section */}
      <section data-testid="user-management-section">
        <div className="bg-crit-purple-600 rounded-t-lg px-4 sm:px-8 py-3 sm:py-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-white">
            {activeTab === 'users' ? 'User Management' : 'Test User Management'}
          </h2>
        </div>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-b-lg px-4 sm:px-8 py-6">
          {activeTab === 'users' && renderUserTable(productionUsers)}
          {activeTab === 'test' && renderUserTable(testUsers)}
        </div>
      </section>

      {/* System Status */}
      <section data-testid="system-status-section">
        <div className="bg-slate-700 rounded-t-lg px-4 sm:px-8 py-3 sm:py-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-white">
            System Status
          </h2>
        </div>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-b-lg px-8 py-12 sm:py-16">
          <div className="text-center">
            <svg
              className="w-20 h-20 mx-auto mb-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Coming March 2026
            </h3>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              System monitoring, performance metrics, and health checks will be available soon.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
