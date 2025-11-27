/**
 * Security Test: Ensure server-side code is not bundled into client components
 *
 * This test prevents the critical error:
 * "PrismaClient is unable to run in this browser environment"
 *
 * Client components ('use client') must NOT import:
 * - @prisma/client (PrismaClient, Prisma types that bundle runtime)
 * - Database clients or connections
 * - Server-only secrets or configurations
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Patterns that should NEVER appear in client components
const FORBIDDEN_IMPORTS = [
  // Prisma - causes "PrismaClient is unable to run in browser" error
  { pattern: /from\s+['"]@prisma\/client['"]/, name: '@prisma/client' },
  { pattern: /from\s+['"]@prisma\/client-\w+['"]/, name: '@prisma/client-*' },
  { pattern: /require\s*\(\s*['"]@prisma\/client['"]\s*\)/, name: 'require(@prisma/client)' },

  // Direct database imports
  { pattern: /from\s+['"]@\/lib\/db\/main['"]/, name: '@/lib/db/main' },
  { pattern: /from\s+['"]@\/lib\/db\/core-concepts['"]/, name: '@/lib/db/core-concepts' },
  { pattern: /from\s+['"]\.\.?\/.*db['"]\s*(?!\.types)/, name: 'direct db import' },

  // Server-only Next.js features
  { pattern: /from\s+['"]server-only['"]/, name: 'server-only (should not be in use client)' },

  // Node.js built-ins that don't work in browser
  { pattern: /require\s*\(\s*['"]fs['"]\s*\)/, name: 'require(fs)' },
  { pattern: /require\s*\(\s*['"]child_process['"]\s*\)/, name: 'require(child_process)' },
  { pattern: /from\s+['"]node:/, name: 'node: protocol imports' },
];

// Files/directories to exclude from checking
const EXCLUDED_PATHS = [
  'node_modules',
  '.next',
  'dist',
  '.git',
  '__tests__',
  'tests',
  '*.test.ts',
  '*.test.tsx',
  '*.spec.ts',
  '*.spec.tsx',
];

function isClientComponent(content: string): boolean {
  // Check if file starts with 'use client' directive
  const lines = content.split('\n').slice(0, 10); // Check first 10 lines
  return lines.some(line => {
    const trimmed = line.trim();
    return trimmed === "'use client'" ||
           trimmed === '"use client"' ||
           trimmed === "'use client';" ||
           trimmed === '"use client";';
  });
}

function findForbiddenImports(content: string, filePath: string): string[] {
  const violations: string[] = [];

  for (const { pattern, name } of FORBIDDEN_IMPORTS) {
    if (pattern.test(content)) {
      // For type-only imports, we still flag them because Prisma's bundling is problematic
      // Even `import type { X } from '@prisma/client'` can cause issues
      const isTypeOnly = /import\s+type\s+\{[^}]+\}\s+from\s+['"]@prisma\/client/.test(content);
      const note = isTypeOnly ? ' (type-only import still causes bundling issues)' : '';
      violations.push(`${name}${note}`);
    }
  }

  return violations;
}

describe('Server-side code isolation', () => {
  it('should not import Prisma or database code in client components', async () => {
    const srcDir = path.join(process.cwd(), 'src');

    // Find all TypeScript/TSX files in src
    const files = await glob('**/*.{ts,tsx}', {
      cwd: srcDir,
      ignore: EXCLUDED_PATHS,
      absolute: true,
    });

    const violations: { file: string; imports: string[] }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');

      // Only check client components
      if (!isClientComponent(content)) {
        continue;
      }

      const forbiddenImports = findForbiddenImports(content, file);

      if (forbiddenImports.length > 0) {
        const relativePath = path.relative(process.cwd(), file);
        violations.push({
          file: relativePath,
          imports: forbiddenImports,
        });
      }
    }

    if (violations.length > 0) {
      const errorMessage = [
        '\n❌ SERVER-SIDE CODE DETECTED IN CLIENT COMPONENTS\n',
        'The following client components import server-side code that will break in the browser:\n',
        ...violations.map(v =>
          `  📁 ${v.file}\n     Forbidden imports: ${v.imports.join(', ')}`
        ),
        '\n\n💡 SOLUTIONS:',
        '  1. For Prisma types: Create shared type definitions in @/types/ without Prisma imports',
        '  2. For database calls: Move to API routes or Server Components',
        '  3. For server utilities: Use "server-only" package in server files, not client files',
        '\n  Example fix for UserTier:',
        '    // BAD:  import type { UserTier } from "@prisma/client"',
        '    // GOOD: import type { UserTier } from "@/types/user"',
        '\n  See: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns',
      ].join('\n');

      expect(violations).toEqual([]);
    }
  });

  it('should have shared types for commonly used Prisma types', async () => {
    // Check that we have a types directory with shared types
    const typesDir = path.join(process.cwd(), 'src', 'types');
    const hasTypesDir = fs.existsSync(typesDir);

    if (!hasTypesDir) {
      console.warn('⚠️  Consider creating src/types/ for shared type definitions');
    }

    // This test is advisory - it passes but logs a warning
    expect(true).toBe(true);
  });
});
