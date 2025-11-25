#!/usr/bin/env tsx
/**
 * Migration Helper Script
 *
 * This script helps run Prisma migrations when connection pool is exhausted:
 * 1. Kills Node.js processes holding DB connections
 * 2. Waits for connections to close
 * 3. Runs the migration
 * 4. Restarts the dev server
 */

import { execSync } from 'child_process';

console.log('🔍 Checking for Node.js processes with DB connections...\n');

// Function to kill Node processes (except this one)
function killNodeProcesses() {
  try {
    // On Windows, kill all node.exe processes except the current one
    const currentPid = process.pid;
    const result = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH', {
      encoding: 'utf-8'
    });

    const lines = result.split('\n').filter(line => line.trim());
    const pids = lines
      .map(line => {
        const match = line.match(/node\.exe","(\d+)"/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(pid => pid && pid !== currentPid);

    if (pids.length === 0) {
      console.log('✓ No other Node.js processes found\n');
      return;
    }

    console.log(`⚠️  Found ${pids.length} Node.js process(es) that may be holding connections:`);
    pids.forEach(pid => console.log(`   - PID ${pid}`));
    console.log();

    // Kill each process
    pids.forEach(pid => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`✓ Killed process ${pid}`);
      } catch (err) {
        console.warn(`⚠️  Could not kill process ${pid}:`, err);
      }
    });
    console.log();
  } catch (error) {
    console.error('Error killing processes:', error);
  }
}

// Function to wait for connections to close
async function waitForConnectionsToClose(seconds: number = 5) {
  console.log(`⏳ Waiting ${seconds} seconds for connections to close...`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  console.log('✓ Wait complete\n');
}

// Function to check if DATABASE_URL has connection pooling
function checkConnectionPooling() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable not found');
    process.exit(1);
  }

  const hasPooling = dbUrl.includes('connection_limit') || dbUrl.includes('pool_timeout');

  if (!hasPooling) {
    console.warn('⚠️  WARNING: DATABASE_URL does not include connection pooling parameters');
    console.warn('   Recommended: Add ?connection_limit=5&pool_timeout=10 to your DATABASE_URL');
    console.warn('   Example: postgresql://user:pass@host:port/db?connection_limit=5&pool_timeout=10\n');
  } else {
    console.log('✓ Connection pooling parameters detected in DATABASE_URL\n');
  }
}

// Function to run migration
function runMigration() {
  console.log('🔄 Running Prisma migration...\n');
  try {
    execSync('npx prisma migrate dev --name add_rpg_campaigns_and_world_permissions', {
      stdio: 'inherit',
    });
    console.log('\n✅ Migration completed successfully!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting migration helper...\n');

  // Step 1: Check connection pooling
  checkConnectionPooling();

  // Step 2: Kill Node processes
  killNodeProcesses();

  // Step 3: Wait for connections to close
  await waitForConnectionsToClose(5);

  // Step 4: Run migration
  const success = runMigration();

  if (success) {
    console.log('💡 You can now restart your dev server with: npm run dev');
    process.exit(0);
  } else {
    console.log('\n❌ Migration failed. Possible issues:');
    console.log('   1. Connection pool still exhausted (try again in a few moments)');
    console.log('   2. DATABASE_URL needs connection pooling parameters');
    console.log('   3. Other services/Docker containers holding connections');
    process.exit(1);
  }
}

main().catch(console.error);
