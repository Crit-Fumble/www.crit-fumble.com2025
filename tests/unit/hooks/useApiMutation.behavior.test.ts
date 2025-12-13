/**
 * Behavior tests for useApiMutation hook
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useApiMutation } from '@/hooks/useApiMutation'

describe('useApiMutation', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useApiMutation<string>())

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('should set isLoading to true during mutation', async () => {
    const { result } = renderHook(() => useApiMutation<string>())

    let resolvePromise: (value: string) => void
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve
    })

    act(() => {
      result.current.mutate(() => promise)
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolvePromise!('done')
      await promise
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should set data and isSuccess on successful mutation', async () => {
    const { result } = renderHook(() => useApiMutation<{ id: number }>())

    await act(async () => {
      await result.current.mutate(async () => ({ id: 123 }))
    })

    expect(result.current.data).toEqual({ id: 123 })
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should set error and isError on failed mutation', async () => {
    const { result } = renderHook(() => useApiMutation<string>())

    await act(async () => {
      try {
        await result.current.mutate(async () => {
          throw new Error('API Error')
        })
      } catch {
        // Expected to throw
      }
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe('API Error')
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.data).toBeNull()
  })

  it('should handle error without message', async () => {
    const { result } = renderHook(() => useApiMutation<string>())

    await act(async () => {
      try {
        await result.current.mutate(async () => {
          throw {}
        })
      } catch {
        // Expected to throw
      }
    })

    expect(result.current.error).toBe('An error occurred')
  })

  it('should re-throw error from mutation', async () => {
    const { result } = renderHook(() => useApiMutation<string>())
    const error = new Error('Test error')

    await expect(
      act(async () => {
        await result.current.mutate(async () => {
          throw error
        })
      })
    ).rejects.toThrow('Test error')
  })

  it('should return data from mutate call', async () => {
    const { result } = renderHook(() => useApiMutation<{ value: string }>())

    let returnedData: { value: string } | undefined

    await act(async () => {
      returnedData = await result.current.mutate(async () => ({ value: 'test' }))
    })

    expect(returnedData).toEqual({ value: 'test' })
  })

  it('should reset state when reset is called', async () => {
    const { result } = renderHook(() => useApiMutation<string>())

    await act(async () => {
      await result.current.mutate(async () => 'data')
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toBe('data')

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('should clear previous state on new mutation', async () => {
    const { result } = renderHook(() => useApiMutation<string>())

    await act(async () => {
      await result.current.mutate(async () => 'first')
    })

    expect(result.current.data).toBe('first')

    await act(async () => {
      await result.current.mutate(async () => 'second')
    })

    expect(result.current.data).toBe('second')
  })

  it('should clear success state when new mutation fails', async () => {
    const { result } = renderHook(() => useApiMutation<string>())

    await act(async () => {
      await result.current.mutate(async () => 'success')
    })

    expect(result.current.isSuccess).toBe(true)

    await act(async () => {
      try {
        await result.current.mutate(async () => {
          throw new Error('Failed')
        })
      } catch {
        // Expected
      }
    })

    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(true)
  })

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useApiMutation<string>())

    const { mutate: m1, reset: r1 } = result.current

    rerender()

    const { mutate: m2, reset: r2 } = result.current

    expect(m1).toBe(m2)
    expect(r1).toBe(r2)
  })
})
