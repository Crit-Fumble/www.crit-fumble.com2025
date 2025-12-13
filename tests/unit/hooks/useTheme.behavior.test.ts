/**
 * Behavior tests for useTheme hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '@/hooks/useTheme'

describe('useTheme', () => {
  let originalMatchMedia: typeof window.matchMedia
  let originalLocalStorage: Storage

  beforeEach(() => {
    // Store originals
    originalMatchMedia = window.matchMedia
    originalLocalStorage = window.localStorage

    // Mock localStorage
    const storage: Record<string, string> = {}
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key]
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach((key) => delete storage[key])
      }),
      key: vi.fn(),
      length: 0,
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Reset document classes
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage })
    document.documentElement.classList.remove('dark')
  })

  it('should initialize with light mode by default', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.isDarkMode).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should initialize with dark mode from localStorage', () => {
    ;(window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('dark')

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDarkMode).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should initialize with light mode from localStorage', () => {
    ;(window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('light')

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDarkMode).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should use system preference when no localStorage value', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDarkMode).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should toggle theme from light to dark', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.isDarkMode).toBe(false)

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.isDarkMode).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
  })

  it('should toggle theme from dark to light', () => {
    ;(window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('dark')

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDarkMode).toBe(true)

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.isDarkMode).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')

    act(() => {
      result.current.toggleTheme()
    })

    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('should add dark class to document when toggling to dark mode', () => {
    const { result } = renderHook(() => useTheme())

    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => {
      result.current.toggleTheme()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should remove dark class from document when toggling to light mode', () => {
    ;(window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('dark')

    const { result } = renderHook(() => useTheme())

    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      result.current.toggleTheme()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
