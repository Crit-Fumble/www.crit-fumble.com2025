'use client'

import { CoreConceptsUI } from './CoreConceptsUI'

interface RpgSystem {
  id: string
  systemId: string
  name: string
  title: string
  description: string | null
  version: string | null
  author: string | null
  publisher: string | null
  license: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  platforms: any
  isEnabled: boolean
  isCore: boolean
  priority: number
  notes: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

interface OwnerDashboardTabsProps {
  gameSystems: RpgSystem[]
  worlds: Array<{
    id: string
    name: string
    description: string | null
  }>
}

export function OwnerDashboardTabs({ gameSystems, worlds }: OwnerDashboardTabsProps) {
  return (
    <div className="w-full">
      <CoreConceptsUI gameSystems={gameSystems} worlds={worlds} />
    </div>
  )
}
