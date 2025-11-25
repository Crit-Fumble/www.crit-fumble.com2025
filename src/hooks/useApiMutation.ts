import { useState, useCallback } from 'react'

/**
 * State for API mutation operations
 */
interface MutationState<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

/**
 * Hook to manage API mutation state (POST, PATCH, DELETE, etc.)
 * Handles loading, error, and success states for API calls
 *
 * @returns Object containing mutation state and execute function
 *
 * @example
 * ```tsx
 * const { mutate, isLoading, error, data } = useApiMutation<User>()
 *
 * const handleSubmit = async () => {
 *   await mutate(async () => {
 *     const res = await fetch('/api/user', { method: 'POST', body: JSON.stringify(formData) })
 *     if (!res.ok) throw new Error('Failed to update')
 *     return res.json()
 *   })
 * }
 * ```
 */
export function useApiMutation<T = unknown>() {
  const [state, setState] = useState<MutationState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  })

  const mutate = useCallback(async (mutationFn: () => Promise<T>) => {
    setState({
      data: null,
      error: null,
      isLoading: true,
      isSuccess: false,
      isError: false,
    })

    try {
      const data = await mutationFn()
      setState({
        data,
        error: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
      })
      return data
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred'
      setState({
        data: null,
        error: errorMessage,
        isLoading: false,
        isSuccess: false,
        isError: true,
      })
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    })
  }, [])

  return {
    ...state,
    mutate,
    reset,
  }
}
