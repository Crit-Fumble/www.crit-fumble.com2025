/**
 * Behavior tests for useFormState hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormState } from '@/hooks/useFormState'

describe('useFormState', () => {
  it('should initialize with provided values', () => {
    const initialValues = { username: '', email: '', bio: '' }
    const { result } = renderHook(() => useFormState(initialValues))

    expect(result.current.values).toEqual(initialValues)
  })

  it('should update value on handleChange', () => {
    const { result } = renderHook(() =>
      useFormState({ username: '', email: '' })
    )

    act(() => {
      result.current.handleChange({
        target: { name: 'username', value: 'testuser', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.values.username).toBe('testuser')
    expect(result.current.values.email).toBe('')
  })

  it('should handle checkbox inputs correctly', () => {
    const { result } = renderHook(() =>
      useFormState({ rememberMe: false, newsletter: false })
    )

    act(() => {
      result.current.handleChange({
        target: { name: 'rememberMe', value: '', type: 'checkbox', checked: true },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.values.rememberMe).toBe(true)

    act(() => {
      result.current.handleChange({
        target: { name: 'rememberMe', value: '', type: 'checkbox', checked: false },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.values.rememberMe).toBe(false)
  })

  it('should set individual value using setValue', () => {
    const { result } = renderHook(() =>
      useFormState({ name: '', age: 0 })
    )

    act(() => {
      result.current.setValue('name', 'John')
    })

    expect(result.current.values.name).toBe('John')

    act(() => {
      result.current.setValue('age', 25)
    })

    expect(result.current.values.age).toBe(25)
  })

  it('should set all values using setValues', () => {
    const { result } = renderHook(() =>
      useFormState({ first: '', second: '' })
    )

    act(() => {
      result.current.setValues({ first: 'a', second: 'b' })
    })

    expect(result.current.values).toEqual({ first: 'a', second: 'b' })
  })

  it('should reset values to initial state', () => {
    const initialValues = { name: 'initial', count: 0 }
    const { result } = renderHook(() => useFormState(initialValues))

    act(() => {
      result.current.setValue('name', 'modified')
      result.current.setValue('count', 10)
    })

    expect(result.current.values.name).toBe('modified')
    expect(result.current.values.count).toBe(10)

    act(() => {
      result.current.reset()
    })

    expect(result.current.values).toEqual(initialValues)
  })

  it('should maintain stable function references', () => {
    // Use a stable reference for initialValues to test callback stability
    const initialValues = { test: '' }
    const { result, rerender } = renderHook(() =>
      useFormState(initialValues)
    )

    const { handleChange: hc1, setValue: sv1, reset: r1 } = result.current

    rerender()

    const { handleChange: hc2, setValue: sv2, reset: r2 } = result.current

    expect(hc1).toBe(hc2)
    expect(sv1).toBe(sv2)
    // Note: reset depends on initialValues reference, so it's stable if the reference is stable
    expect(r1).toBe(r2)
  })
})
