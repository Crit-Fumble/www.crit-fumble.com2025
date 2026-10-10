'use client'

import { useEffect, useState } from 'react'
import { fetchHostStatus, type HostStatus } from './host-status'

/**
 * One row per host the status service reports — the list is its, not this
 * page's. Read once on load: no polling from a visitor's tab.
 *
 * `undefined` is "still asking"; `null` is "the status service did not answer",
 * which says nothing about the hosts and is worded that way.
 */
export function HostStatusList() {
  const [rows, setRows] = useState<HostStatus[] | null | undefined>(undefined)

  useEffect(() => {
    fetchHostStatus().then(setRows)
  }, [])

  return (
    <div aria-live="polite" data-testid="host-status">
      {rows === undefined && <p className="text-center text-white/60">Checking status...</p>}
      {rows === null && <p className="text-center text-white/70">Status is unavailable right now.</p>}
      {rows && (
        <ul className="max-w-xl mx-auto divide-y divide-white/10">
          {rows.map(({ host, ok }) => (
            <li key={host} className="flex items-center justify-between gap-4 py-2">
              <span className="font-mono text-sm text-gray-100 break-all">{host}</span>
              <span
                className={`inline-flex items-center gap-2 text-sm font-semibold shrink-0 ${ok ? 'text-emerald-300' : 'text-amber-300'}`}
              >
                <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {ok ? 'Reachable' : 'Not responding'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
