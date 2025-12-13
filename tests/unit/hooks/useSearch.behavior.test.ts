/**
 * Behavior tests for useSearch hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from '@/hooks/useSearch'

interface User {
  id: number
  name: string
  email: string
}

const mockUsers: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' },
  { id: 4, name: 'Alice Williams', email: 'alice.w@example.com' },
]

const searchFields = (user: User) => [user.name, user.email]

describe('useSearch', () => {
  it('should initialize with empty query and all items', () => {
    const { result } = renderHook(() => useSearch(mockUsers, searchFields))

    expect(result.current.query).toBe('')
    expect(result.current.filteredItems).toEqual(mockUsers)
  })

  it('should initialize with custom initial query', () => {
    const { result } = renderHook(() => useSearch(mockUsers, searchFields, 'alice'))

    expect(result.current.query).toBe('alice')
    expect(result.current.filteredItems).toHaveLength(2)
    expect(result.current.filteredItems.map(u => u.id)).toEqual([1, 4])
  })

  it('should filter items when query changes', () => {
    const { result } = renderHook(() => useSearch(mockUsers, searchFields))

    act(() => {
      result.current.setQuery('bob')
    })

    expect(result.current.filteredItems).toHaveLength(1)
    expect(result.current.filteredItems[0].name).toBe('Bob Smith')
  })

  it('should be case insensitive', () => {
    const { result } = renderHook(() => useSearch(mockUsers, searchFields))

    act(() => {
      result.current.setQuery('ALICE')
    })

    expect(result.current.filteredItems).toHaveLength(2)

    act(() => {
      result.current.setQuery('aLiCe')
    })

    expect(result.current.filteredItems).toHaveLength(2)
  })

  it('should return all items when query is empty or whitespace', () => {
    const { result } = renderHook(() => useSearch(mockUsers, searchFields))

    act(() => {
      result.current.setQuery('alice')
    })

    expect(result.current.filteredItems).toHaveLength(2)

    act(() => {
      result.current.setQuery('')
    })

    expect(result.current.filteredItems).toEqual(mockUsers)

    act(() => {
      result.current.setQuery('   ')
    })

    expect(result.current.filteredItems).toEqual(mockUsers)
  })

  it('should search across multiple fields', () => {
    const { result } = renderHook(() => useSearch(mockUsers, searchFields))

    act(() => {
      result.current.setQuery('example.com')
    })

    expect(result.current.filteredItems).toHaveLength(4)

    act(() => {
      result.current.setQuery('charlie@')
    })

    expect(result.current.filteredItems).toHaveLength(1)
    expect(result.current.filteredItems[0].name).toBe('Charlie Brown')
  })

  it('should return empty array when no matches found', () => {
    const { result } = renderHook(() => useSearch(mockUsers, searchFields))

    act(() => {
      result.current.setQuery('nonexistent')
    })

    expect(result.current.filteredItems).toHaveLength(0)
  })

  it('should handle null/undefined fields gracefully', () => {
    const itemsWithNulls = [
      { id: 1, name: 'Test', email: null },
      { id: 2, name: null, email: 'test@example.com' },
    ]

    const { result } = renderHook(() =>
      useSearch(itemsWithNulls, (item) => [item.name, item.email])
    )

    act(() => {
      result.current.setQuery('test')
    })

    expect(result.current.filteredItems).toHaveLength(2)
  })

  it('should update when items array changes', () => {
    const { result, rerender } = renderHook(
      ({ items }) => useSearch(items, searchFields),
      { initialProps: { items: mockUsers } }
    )

    expect(result.current.filteredItems).toHaveLength(4)

    const newUsers = mockUsers.slice(0, 2)
    rerender({ items: newUsers })

    expect(result.current.filteredItems).toHaveLength(2)
  })
})
