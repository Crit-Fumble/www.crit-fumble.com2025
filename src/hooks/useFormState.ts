import { useState, useCallback, ChangeEvent } from 'react'

/**
 * Hook to manage form state with automatic change handlers
 *
 * @param initialValues - Object containing initial form values
 * @returns Object with values, handleChange, setValues, and reset functions
 *
 * @example
 * ```tsx
 * const { values, handleChange, reset } = useFormState({
 *   username: '',
 *   email: '',
 *   bio: ''
 * })
 *
 * <input name="username" value={values.username} onChange={handleChange} />
 * <input name="email" value={values.email} onChange={handleChange} />
 * ```
 */
export function useFormState<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target

      setValues((prev) => ({
        ...prev,
        [name]: type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
      }))
    },
    []
  )

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
  }, [initialValues])

  return {
    values,
    handleChange,
    setValue,
    setValues,
    reset,
  }
}
