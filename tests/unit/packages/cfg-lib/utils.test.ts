import { describe, it, expect } from 'vitest';
import { cn } from '@/packages/cfg-lib/utils';

describe('cn (className utility)', () => {
  it('should merge single className', () => {
    const result = cn('text-red-500');
    expect(result).toBe('text-red-500');
  });

  it('should merge multiple classNames', () => {
    const result = cn('text-red-500', 'bg-blue-200');
    expect(result).toBe('text-red-500 bg-blue-200');
  });

  it('should handle conditional classNames', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should filter out false conditional classNames', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('should merge conflicting Tailwind classes correctly', () => {
    // twMerge should keep the last conflicting class
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
  });

  it('should handle arrays of classNames', () => {
    const result = cn(['text-red-500', 'bg-blue-200']);
    expect(result).toBe('text-red-500 bg-blue-200');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'text-red-500': true,
      'bg-blue-200': false,
      'font-bold': true,
    });
    expect(result).toBe('text-red-500 font-bold');
  });

  it('should handle mixed inputs', () => {
    const result = cn(
      'base-class',
      ['array-class-1', 'array-class-2'],
      { 'object-class': true, 'hidden-class': false },
      undefined,
      null,
      'final-class'
    );
    expect(result).toBe('base-class array-class-1 array-class-2 object-class final-class');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle undefined and null values', () => {
    const result = cn('text-red-500', undefined, null, 'bg-blue-200');
    expect(result).toBe('text-red-500 bg-blue-200');
  });

  it('should handle complex Tailwind merge scenarios', () => {
    // Different variants of the same utility should merge correctly
    const result = cn('px-4 py-2', 'p-8');
    expect(result).toBe('p-8');
  });

  it('should preserve non-conflicting classes', () => {
    const result = cn('text-red-500 px-4', 'bg-blue-200 py-2');
    // Order is preserved as passed to the function
    expect(result).toBe('text-red-500 px-4 bg-blue-200 py-2');
  });

  it('should handle responsive modifiers', () => {
    const result = cn('text-sm md:text-base lg:text-lg');
    expect(result).toBe('text-sm md:text-base lg:text-lg');
  });

  it('should merge responsive conflicts correctly', () => {
    const result = cn('md:text-base', 'md:text-lg');
    expect(result).toBe('md:text-lg');
  });
});
