/**
 * Tests for General Utility Functions
 */

import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className merge utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'bg-blue-500')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
      expect(result).toContain('bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', {
        'active-class': true,
        'inactive-class': false,
      })
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
      expect(result).not.toContain('inactive-class')
    })

    it('should merge conflicting Tailwind classes correctly', () => {
      // Tailwind merge should keep the last class when there's a conflict
      const result = cn('p-2', 'p-4')
      expect(result).toBe('p-4')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['px-2', 'py-1'], 'bg-blue-500')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
      expect(result).toContain('bg-blue-500')
    })

    it('should handle undefined and null values', () => {
      const result = cn('px-2', undefined, null, 'py-1')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
    })

    it('should handle empty strings', () => {
      const result = cn('px-2', '', 'py-1')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
    })

    it('should handle no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should merge responsive classes correctly', () => {
      const result = cn('px-2 md:px-4', 'py-1 md:py-2')
      expect(result).toContain('px-2')
      expect(result).toContain('md:px-4')
      expect(result).toContain('py-1')
      expect(result).toContain('md:py-2')
    })

    it('should handle pseudo-class variants', () => {
      const result = cn('hover:bg-blue-500', 'focus:bg-blue-600')
      expect(result).toContain('hover:bg-blue-500')
      expect(result).toContain('focus:bg-blue-600')
    })

    it('should merge dark mode variants correctly', () => {
      const result = cn('bg-white dark:bg-gray-900', 'text-black dark:text-white')
      expect(result).toContain('bg-white')
      expect(result).toContain('dark:bg-gray-900')
      expect(result).toContain('text-black')
      expect(result).toContain('dark:text-white')
    })
  })
})
