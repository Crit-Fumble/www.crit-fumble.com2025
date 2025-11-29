'use client'

import { useEffect, useState } from 'react'
import { FumbleBotChat } from '@crit-fumble/react/web'

interface User {
  name: string
  image: string | null
}

export function FloatingFumbleBot() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch session to check if user is logged in
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const session = await res.json()
          if (session?.user) {
            setUser({
              name: session.user.name || 'User',
              image: session.user.image || null,
            })
          }
        }
      } catch {
        // Not logged in or error - that's fine
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  // Don't render anything while loading or if not logged in
  if (loading || !user) {
    return null
  }

  return (
    <FumbleBotChat
      user={user}
      apiEndpoint="/api/fumblebot/chat"
      testId="floating-fumblebot"
    />
  )
}
