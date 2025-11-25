import { useState, useMemo } from 'react'

/**
 * Hook to manage search/filter functionality for a list of items
 *
 * @param items - Array of items to search through
 * @param searchFields - Function to extract searchable fields from an item
 * @param initialQuery - Initial search query (default: '')
 * @returns Object containing query, setQuery, and filtered items
 *
 * @example
 * ```tsx
 * const { query, setQuery, filteredItems } = useSearch(
 *   users,
 *   (user) => [user.name, user.email, user.username]
 * )
 *
 * <input value={query} onChange={(e) => setQuery(e.target.value)} />
 * {filteredItems.map(item => <div>{item.name}</div>)}
 * ```
 */
export function useSearch<T>(
  items: T[],
  searchFields: (item: T) => (string | null | undefined)[],
  initialQuery: string = ''
) {
  const [query, setQuery] = useState(initialQuery)

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items

    const searchLower = query.toLowerCase()

    return items.filter((item) => {
      const fields = searchFields(item)
      return fields.some((field) =>
        field?.toLowerCase().includes(searchLower)
      )
    })
  }, [items, query, searchFields])

  return {
    query,
    setQuery,
    filteredItems,
  }
}
