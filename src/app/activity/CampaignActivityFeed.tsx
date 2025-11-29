'use client'

import { useState, useEffect } from 'react'
import { CampaignActivityFeed as CampaignActivityFeedUI } from '@crit-fumble/react/activity'
import type { UserActivity } from '@crit-fumble/react/activity'

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
      setError('Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CampaignActivityFeedUI
      activities={activities}
      isLoading={loading}
      error={error}
      onRetry={() => {
        setError(null)
        setLoading(true)
        fetchActivities()
      }}
    />
  )
}
