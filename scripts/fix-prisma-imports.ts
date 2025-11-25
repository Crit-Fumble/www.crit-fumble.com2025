#!/usr/bin/env tsx
/**
 * Fix Prisma Client Imports
 *
 * This script fixes all API route files that create new PrismaClient() instances
 * and replaces them with imports of the singleton instance from @/lib/db or @/packages/cfg-lib/db-main
 */

import * as fs from 'fs';
import * as path from 'path';

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function fixPrismaImports() {
  console.log('🔍 Scanning for files with PrismaClient issues...\n');

  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
  const files = getAllFiles(apiDir);

  let fixed = 0;
  let skipped = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');

    // Check if file has the problematic pattern
    if (content.includes('const prisma = new PrismaClient()')) {
      console.log(`📝 Fixing: ${path.relative(process.cwd(), file)}`);

      let newContent = content;

      // Replace the import and instantiation
      newContent = newContent.replace(
        /import { PrismaClient } from '@prisma\/client';\s*\n\s*const prisma = new PrismaClient\(\);/g,
        "import prismaMain from '@/packages/cfg-lib/db-main';\n\nconst prisma = prismaMain;"
      );

      // Also handle cases where there's other imports before PrismaClient
      newContent = newContent.replace(
        /import { PrismaClient } from '@prisma\/client';/g,
        "import prismaMain from '@/packages/cfg-lib/db-main';"
      );

      newContent = newContent.replace(
        /\nconst prisma = new PrismaClient\(\);/g,
        '\nconst prisma = prismaMain;'
      );

      if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf-8');
        console.log(`   ✅ Fixed\n`);
        fixed++;
      } else {
        console.log(`   ⚠️  No changes made\n`);
        skipped++;
      }
    }
  });

  console.log(`\n✨ Summary:`);
  console.log(`   Fixed: ${fixed} files`);
  console.log(`   Skipped: ${skipped} files`);
  console.log(`\n💡 This will drastically reduce database connections!`);
}

fixPrismaImports();
