import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/unit/setup.ts'],
    // Only include unit tests - Playwright tests use their own runner
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
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
    // Handle CommonJS modules that don't support ESM named exports
    deps: {
      inline: ['rrule', '@crit-fumble/core'],
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
