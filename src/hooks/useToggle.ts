import { useState, useCallback } from 'react'

/**
 * Hook to manage boolean toggle state
 *
 * @param initialValue - Initial boolean value (default: false)
 * @returns Tuple of [value, toggle, setTrue, setFalse, setValue]
 *
 * @example
 * ```tsx
 * const [isOpen, toggleOpen, openMenu, closeMenu] = useToggle(false)
 * ```
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => setValue((v) => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return [value, toggle, setTrue, setFalse, setValue]
}
