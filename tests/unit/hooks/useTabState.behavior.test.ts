/**
 * Behavior tests for useTabState hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTabState } from '@/hooks/useTabState'

describe('useTabState', () => {
  it('should initialize with provided tab', () => {
    const { result } = renderHook(() => useTabState('profile'))
    const [activeTab] = result.current
    expect(activeTab).toBe('profile')
  })

  it('should update tab when setActiveTab is called', () => {
    const { result } = renderHook(() => useTabState<'profile' | 'settings'>('profile'))

    expect(result.current[0]).toBe('profile')

    act(() => {
      result.current[1]('settings')
    })

    expect(result.current[0]).toBe('settings')
  })

  it('should work with different tab types', () => {
    const { result } = renderHook(() => useTabState<'tab1' | 'tab2' | 'tab3'>('tab1'))

    act(() => {
      result.current[1]('tab2')
    })
    expect(result.current[0]).toBe('tab2')

    act(() => {
      result.current[1]('tab3')
    })
    expect(result.current[0]).toBe('tab3')

    act(() => {
      result.current[1]('tab1')
    })
    expect(result.current[0]).toBe('tab1')
  })
})
