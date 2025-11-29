'use client'

import { useState, useEffect } from 'react'
import type { UserActivity } from '@crit-fumble/core/types'

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function GuildCard({ activity }: { activity: UserActivity }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Guild Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-crit-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          {activity.guildName || 'Unknown Server'}
        </h2>
      </div>

      {/* Campaigns */}
      <div className="divide-y divide-slate-800">
        {activity.campaigns.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No campaigns in this server yet.
          </div>
        ) : (
          activity.campaigns.map((campaign) => (
            <div key={campaign.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    {campaign.name}
                    {campaign.hasActiveSession && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                      </span>
                    )}
                  </h3>

                  {/* Active Session */}
                  {campaign.activeSession && (
                    <div className="mt-2 pl-4 border-l-2 border-crit-purple-500/50">
                      <p className="text-sm text-gray-300">
                        {campaign.activeSession.name || 'Unnamed Session'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Started {formatRelativeTime(new Date(campaign.activeSession.startedAt))}
                      </p>
                    </div>
                  )}

                  {/* Characters */}
                  {campaign.characters.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {campaign.characters.map((char) => (
                        <div
                          key={char.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full text-sm"
                        >
                          {char.avatarUrl ? (
                            <img
                              src={char.avatarUrl}
                              alt={char.name}
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs text-gray-400">
                              {char.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-gray-200">{char.name}</span>
                          <span className="text-xs text-gray-500 capitalize">{char.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campaign actions */}
                <div className="flex-shrink-0">
                  <span className="text-xs text-gray-500">
                    {campaign.characters.length} character{campaign.characters.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function CampaignActivityFeed() {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivities()
  }, [])

  async function fetchActivities() {
    try {
      const res = await fetch('/api/core/auth/activities')

      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to view activity')
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Failed to load activity')
        }
        return
      }

      const data = await res.json()
      setActivities(data.activities || [])
    } catch (err) {
      console.error('Failed to fetch activities:', err)
      setError('Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden animate-pulse">
            <div className="px-6 py-4 border-b border-slate-800">
              <div className="h-6 bg-slate-800 rounded w-48" />
            </div>
            <div className="px-6 py-4">
              <div className="h-5 bg-slate-800 rounded w-64 mb-3" />
              <div className="h-4 bg-slate-800 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => {
            setError(null)
            setLoading(true)
            fetchActivities()
          }}
          className="mt-4 text-crit-purple-400 hover:text-crit-purple-300"
        >
          Try again
        </button>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">No campaigns yet</p>
        <p className="text-gray-600 mt-2">
          Join a Discord server with FumbleBot to see your campaigns here.
        </p>
      </div>
    )
  }

  // Count totals
  const totalCampaigns = activities.reduce((sum, a) => sum + a.campaigns.length, 0)
  const activeSessions = activities.reduce(
    (sum, a) => sum + a.campaigns.filter((c) => c.hasActiveSession).length,
    0
  )
  const totalCharacters = activities.reduce(
    (sum, a) => sum + a.campaigns.reduce((cSum, c) => cSum + c.characters.length, 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalCampaigns}</p>
          <p className="text-sm text-gray-400">Campaign{totalCampaigns !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{activeSessions}</p>
          <p className="text-sm text-gray-400">Active Session{activeSessions !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-crit-purple-400">{totalCharacters}</p>
          <p className="text-sm text-gray-400">Character{totalCharacters !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Guild cards */}
      {activities.map((activity) => (
        <GuildCard key={activity.guildId} activity={activity} />
      ))}
    </div>
  )
}
