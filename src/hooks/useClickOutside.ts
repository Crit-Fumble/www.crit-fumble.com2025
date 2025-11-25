import { useEffect, RefObject } from 'react'

/**
 * Hook to detect clicks outside of a referenced element
 *
 * @param ref - React ref object pointing to the element to monitor
 * @param handler - Callback function to execute when click outside is detected
 * @param enabled - Whether the hook is active (default: true)
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null)
 * useClickOutside(menuRef, () => setIsOpen(false), isOpen)
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [ref, handler, enabled])
}
