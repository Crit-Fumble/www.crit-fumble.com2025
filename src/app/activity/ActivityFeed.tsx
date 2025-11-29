'use client'

import { useState, useEffect } from 'react'

interface ActivityItem {
  id: string
  type: 'wiki_created' | 'wiki_updated' | 'wiki_published' | 'user_joined' | 'comment' | string
  actorId: string
  actorName: string | null
  actorImage: string | null
  targetType: string | null
  targetId: string | null
  targetTitle: string | null
  targetSlug: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface ActivityFeedProps {
  userId: string
}

const ACTIVITY_ICONS: Record<string, string> = {
  wiki_created: '📝',
  wiki_updated: '✏️',
  wiki_published: '📢',
  user_joined: '👋',
  comment: '💬',
}

const ACTIVITY_VERBS: Record<string, string> = {
  wiki_created: 'created',
  wiki_updated: 'updated',
  wiki_published: 'published',
  user_joined: 'joined',
  comment: 'commented on',
}

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

function ActivityItemCard({ item }: { item: ActivityItem }) {
  const icon = ACTIVITY_ICONS[item.type] || '📌'
  const verb = ACTIVITY_VERBS[item.type] || 'did something with'
  const actorName = item.actorName || 'Someone'
  const targetTitle = item.targetTitle || 'something'

  const targetLink = item.targetSlug
    ? item.targetType === 'wiki'
      ? `/wiki/${item.targetSlug}`
      : null
    : null

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start gap-3">
        {/* Actor avatar or icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
          {item.actorImage ? (
            <img
              src={item.actorImage}
              alt={actorName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <span>{icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-200">
            <span className="font-medium text-white">{actorName}</span>
            {' '}{verb}{' '}
            {targetLink ? (
              <a
                href={targetLink}
                className="font-medium text-crit-purple-400 hover:text-crit-purple-300"
              >
                {targetTitle}
              </a>
            ) : (
              <span className="font-medium text-gray-300">{targetTitle}</span>
            )}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {formatRelativeTime(new Date(item.createdAt))}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivity()
  }, [])

  async function fetchActivity() {
    try {
      const res = await fetch('/api/core/activity?limit=50')

      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to view activity')
        } else {
          setError('Failed to load activity')
        }
        return
      }

      const data = await res.json()
      setActivities(data.activities || [])
    } catch (err) {
      console.error('Failed to fetch activity:', err)
      setError('Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800" />
              <div className="flex-1">
                <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-800 rounded w-1/4" />
              </div>
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
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No activity yet.</p>
        <p className="text-gray-600 mt-2">
          Activity will appear here when members create or update content.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map(item => (
        <ActivityItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
