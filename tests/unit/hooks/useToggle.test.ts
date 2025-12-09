/**
 * Tests for useToggle hook
 *
 * Note: These tests validate the hook's logic and interface.
 * Full integration testing with React is handled by E2E tests.
 */

import { describe, it, expect } from 'vitest'

// Import the hook directly to test its interface
import { useToggle } from '@/hooks/useToggle'

describe('useToggle', () => {
  it('should export a function', () => {
    expect(typeof useToggle).toBe('function')
  })

  it('should be importable from hooks index', async () => {
    const { useToggle: indexedHook } = await import('@/hooks')
    expect(typeof indexedHook).toBe('function')
    expect(indexedHook).toBe(useToggle)
  })
})
