import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/unit/setup.ts'],
    // Only include unit tests - Playwright tests use their own runner
    include: ['tests/unit/**/*.test.ts'],
    exclude: [
      'node_modules/',
      'tests/integration/**',
      'tests/e2e/**',
      'tests/mcp/**',
      '**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Handle Next.js modules
    conditions: ['node', 'default'],
  },
});
