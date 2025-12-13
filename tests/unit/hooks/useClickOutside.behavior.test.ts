/**
 * Behavior tests for useClickOutside hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useRef } from 'react'

describe('useClickOutside', () => {
  let container: HTMLDivElement
  let targetElement: HTMLDivElement
  let outsideElement: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    targetElement = document.createElement('div')
    outsideElement = document.createElement('div')

    container.appendChild(targetElement)
    container.appendChild(outsideElement)
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('should call handler when clicking outside the element', () => {
    const handler = vi.fn()

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(targetElement)
      useClickOutside(ref, handler)
      return ref
    })

    const event = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('should not call handler when clicking inside the element', () => {
    const handler = vi.fn()

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(targetElement)
      useClickOutside(ref, handler)
      return ref
    })

    const event = new MouseEvent('mousedown', { bubbles: true })
    targetElement.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle touch events', () => {
    const handler = vi.fn()

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(targetElement)
      useClickOutside(ref, handler)
      return ref
    })

    const event = new TouchEvent('touchstart', { bubbles: true })
    outsideElement.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler when disabled', () => {
    const handler = vi.fn()

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(targetElement)
      useClickOutside(ref, handler, false)
      return ref
    })

    const event = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should update enabled state dynamically', () => {
    const handler = vi.fn()

    const { rerender } = renderHook(
      ({ enabled }) => {
        const ref = useRef<HTMLDivElement>(targetElement)
        useClickOutside(ref, handler, enabled)
        return ref
      },
      { initialProps: { enabled: true } }
    )

    // Click outside - should trigger
    const event1 = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event1)
    expect(handler).toHaveBeenCalledTimes(1)

    // Disable
    rerender({ enabled: false })

    // Click outside - should not trigger
    const event2 = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event2)
    expect(handler).toHaveBeenCalledTimes(1)

    // Re-enable
    rerender({ enabled: true })

    // Click outside - should trigger again
    const event3 = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event3)
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('should cleanup event listeners on unmount', () => {
    const handler = vi.fn()

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(targetElement)
      useClickOutside(ref, handler)
      return ref
    })

    unmount()

    const event = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle null ref gracefully', () => {
    const handler = vi.fn()

    // Should not crash when ref is null
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(null)
      useClickOutside(ref, handler)
      return ref
    })

    const event = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event)

    // When ref.current is null, the condition `ref.current && !ref.current.contains(...)`
    // short-circuits to false, so handler should NOT be called
    expect(handler).not.toHaveBeenCalled()
  })

  it('should not call handler when clicking on child element', () => {
    const handler = vi.fn()
    const childElement = document.createElement('span')
    targetElement.appendChild(childElement)

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(targetElement)
      useClickOutside(ref, handler)
      return ref
    })

    const event = new MouseEvent('mousedown', { bubbles: true })
    childElement.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })
})
