/**
 * Behavior tests for useToggle hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToggle } from '@/hooks/useToggle'

describe('useToggle', () => {
  it('should initialize with default value false', () => {
    const { result } = renderHook(() => useToggle())
    const [value] = result.current
    expect(value).toBe(false)
  })

  it('should initialize with provided initial value', () => {
    const { result } = renderHook(() => useToggle(true))
    const [value] = result.current
    expect(value).toBe(true)
  })

  it('should toggle value when toggle is called', () => {
    const { result } = renderHook(() => useToggle(false))

    expect(result.current[0]).toBe(false)

    act(() => {
      result.current[1]() // toggle
    })

    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[1]() // toggle again
    })

    expect(result.current[0]).toBe(false)
  })

  it('should set value to true when setTrue is called', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[2]() // setTrue
    })

    expect(result.current[0]).toBe(true)

    // Calling setTrue again should keep it true
    act(() => {
      result.current[2]()
    })

    expect(result.current[0]).toBe(true)
  })

  it('should set value to false when setFalse is called', () => {
    const { result } = renderHook(() => useToggle(true))

    act(() => {
      result.current[3]() // setFalse
    })

    expect(result.current[0]).toBe(false)
  })

  it('should set specific value when setValue is called', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[4](true) // setValue
    })

    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[4](false)
    })

    expect(result.current[0]).toBe(false)
  })

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useToggle(false))

    const [, toggle1, setTrue1, setFalse1, setValue1] = result.current

    rerender()

    const [, toggle2, setTrue2, setFalse2, setValue2] = result.current

    expect(toggle1).toBe(toggle2)
    expect(setTrue1).toBe(setTrue2)
    expect(setFalse1).toBe(setFalse2)
    expect(setValue1).toBe(setValue2)
  })
})
