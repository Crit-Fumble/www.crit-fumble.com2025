import { useState } from 'react'

/**
 * Hook to manage tab state with type safety
 *
 * @param initialTab - The initial active tab
 * @returns Tuple of [activeTab, setActiveTab]
 *
 * @example
 * ```tsx
 * type TabId = 'profile' | 'settings' | 'security'
 * const [activeTab, setActiveTab] = useTabState<TabId>('profile')
 * ```
 */
export function useTabState<T extends string>(initialTab: T) {
  return useState<T>(initialTab)
}
