'use client'

import { useEffect, useState } from 'react'

type Status = 'loading' | 'online' | 'offline'

export function CoreStatusButton() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus(data.ok ? 'online' : 'offline'))
      .catch(() => setStatus('offline'))
  }, [])

  if (status === 'loading') {
    return (
      <div className="inline-flex items-center justify-center w-full max-w-sm mx-auto rounded-lg bg-white/10 px-8 py-4">
        <p className="text-lg font-display font-semibold text-white/60">
          Checking status...
        </p>
      </div>
    )
  }

  if (status === 'offline') {
    return (
      <div className="inline-flex flex-col items-center justify-center w-full max-w-sm mx-auto rounded-lg bg-slate-700/80 px-8 py-4">
        <p className="text-lg font-display font-semibold text-white/70">
          Under Maintenance
        </p>
        <p className="text-sm text-white/40 mt-1">
          We&apos;ll be back soon
        </p>
      </div>
    )
  }

  return (
    <a
      href="https://core.crit-fumble.com"
      className="inline-flex items-center justify-center rounded-xl bg-crit-purple-600 hover:bg-crit-purple-700 border-2 border-crit-purple-400 px-8 py-4 transition-colors"
    >
      <p className="text-lg md:text-xl font-display font-bold text-white">
        Enter Core
      </p>
    </a>
  )
}
