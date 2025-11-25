#!/usr/bin/env tsx
/**
 * Fix Next.js 15 Breaking Change: params is now a Promise
 *
 * Updates all route handlers to await params
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

async function fixRouteHandler(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Pattern 1: export async function GET(request, { params }: { params: { id: string } })
  // Replace with: export async function GET(request, context: { params: Promise<{ id: string }> })
  const pattern1 = /export async function (GET|POST|PUT|PATCH|DELETE)\(\s*request: NextRequest,\s*\{ params \}: \{ params: \{ ([^}]+) \} \}\s*\)/g;

  if (pattern1.test(content)) {
    content = content.replace(
      pattern1,
      'export async function $1(\n  request: NextRequest,\n  context: { params: Promise<{ $2 }> }\n)'
    );
    modified = true;
  }

  // Add await for params usage
  if (modified) {
    // Find the function body and add const params = await context.params;
    content = content.replace(
      /(export async function (?:GET|POST|PUT|PATCH|DELETE)\([^)]+\)\s*\{)/,
      '$1\n  const params = await context.params;'
    );
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }

  return false;
}

async function main() {
  console.log('🔧 Fixing Next.js 15 route handlers...\n');

  // Find all route.ts files with [id] or similar dynamic segments
  const routes = await glob('src/app/api/**/*\\[*\\]*/route.ts', {
    cwd: process.cwd(),
    absolute: true,
  });

  console.log(`Found ${routes.length} dynamic route files\n`);

  let fixedCount = 0;
  for (const route of routes) {
    const fixed = await fixRouteHandler(route);
    if (fixed) fixedCount++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total files: ${routes.length}`);
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Already correct: ${routes.length - fixedCount}`);
}

main().catch(console.error);
