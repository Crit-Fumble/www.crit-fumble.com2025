#!/usr/bin/env tsx
/**
 * Clone Database
 *
 * This script clones data from one database to another.
 * Common use cases:
 * - Clone production to dev (for testing with real data)
 * - Clone dev to staging
 * - Backup before major changes
 *
 * WARNING: This will DELETE all data in the target database!
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import dotenv from 'dotenv';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

interface DatabaseConfig {
  url: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

function parseConnectionString(url: string): DatabaseConfig {
  // Remove query parameters for pg_dump/psql
  const cleanUrl = url.split('?')[0];

  // Parse postgresql://user:pass@host:port/db
  const match = cleanUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  return {
    url,
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
}

function loadEnvironment(env: 'dev' | 'staging' | 'production'): DatabaseConfig {
  const envFile = env === 'dev' ? '.env' : `.env.${env}.local`;
  const envPath = path.join(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envFile}`);
  }

  const envConfig = dotenv.parse(fs.readFileSync(envPath));

  if (!envConfig.DATABASE_URL) {
    throw new Error(`DATABASE_URL not found in ${envFile}`);
  }

  return parseConnectionString(envConfig.DATABASE_URL);
}

async function confirmDangerousOperation(source: string, target: string): Promise<boolean> {
  console.log('\n⚠️  WARNING: DESTRUCTIVE OPERATION ⚠️\n');
  console.log(`This will:`);
  console.log(`   1. DELETE all data in the ${target} database`);
  console.log(`   2. Copy all data from ${source} to ${target}`);
  console.log(`   3. This operation CANNOT be undone\n`);

  const confirmation = await question(`Type "yes" to proceed: `);
  return confirmation.toLowerCase() === 'yes';
}

async function createBackup(db: DatabaseConfig, backupName: string): Promise<string> {
  const backupDir = path.join(process.cwd(), 'backups', 'database');
  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupFile = path.join(backupDir, `${backupName}_${timestamp}.sql`);

  console.log(`\n📦 Creating backup: ${path.basename(backupFile)}...`);

  try {
    execSync(
      `PGPASSWORD="${db.password}" pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -F p --no-owner --no-acl -f "${backupFile}"`,
      { stdio: 'inherit' }
    );

    console.log(`✅ Backup created: ${backupFile}\n`);
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function cloneDatabase(source: DatabaseConfig, target: DatabaseConfig) {
  const dumpFile = path.join(process.cwd(), 'tmp', 'db-clone.sql');
  fs.mkdirSync(path.dirname(dumpFile), { recursive: true });

  try {
    // Step 1: Dump source database
    console.log('\n📤 Dumping source database...');
    execSync(
      `PGPASSWORD="${source.password}" pg_dump -h ${source.host} -p ${source.port} -U ${source.user} -d ${source.database} -F p --no-owner --no-acl -f "${dumpFile}"`,
      { stdio: 'inherit' }
    );
    console.log('✅ Source database dumped\n');

    // Step 2: Drop and recreate target schema
    console.log('🗑️  Clearing target database...');
    execSync(
      `PGPASSWORD="${target.password}" psql -h ${target.host} -p ${target.port} -U ${target.user} -d ${target.database} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`,
      { stdio: 'inherit' }
    );
    console.log('✅ Target database cleared\n');

    // Step 3: Restore to target
    console.log('📥 Restoring to target database...');
    execSync(
      `PGPASSWORD="${target.password}" psql -h ${target.host} -p ${target.port} -U ${target.user} -d ${target.database} -f "${dumpFile}"`,
      { stdio: 'inherit' }
    );
    console.log('✅ Data restored to target\n');

    // Cleanup
    fs.unlinkSync(dumpFile);
  } catch (error) {
    console.error('❌ Clone operation failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🔄 Database Clone Utility\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  let sourceEnv: 'dev' | 'staging' | 'production' | null = null;
  let targetEnv: 'dev' | 'staging' | 'production' | null = null;

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && args[i + 1]) {
      sourceEnv = args[i + 1] as any;
      i++;
    } else if (args[i] === '--to' && args[i + 1]) {
      targetEnv = args[i + 1] as any;
      i++;
    }
  }

  // Interactive mode if not specified
  if (!sourceEnv) {
    console.log('Available environments: dev, staging, production');
    sourceEnv = (await question('Source environment: ')) as any;
  }

  if (!targetEnv) {
    console.log('Available environments: dev, staging, production');
    targetEnv = (await question('Target environment: ')) as any;
  }

  // Validate
  if (!sourceEnv || !['dev', 'staging', 'production'].includes(sourceEnv)) {
    console.error('❌ Invalid source environment');
    process.exit(1);
  }

  if (!targetEnv || !['dev', 'staging', 'production'].includes(targetEnv)) {
    console.error('❌ Invalid target environment');
    process.exit(1);
  }

  if (sourceEnv === targetEnv) {
    console.error('❌ Source and target cannot be the same');
    process.exit(1);
  }

  // Load configurations
  console.log('\n📋 Loading configurations...\n');

  let sourceDb: DatabaseConfig;
  let targetDb: DatabaseConfig;

  try {
    sourceDb = loadEnvironment(sourceEnv);
    console.log(`✅ Loaded ${sourceEnv} database config`);
    console.log(`   Database: ${sourceDb.database} @ ${sourceDb.host}`);

    targetDb = loadEnvironment(targetEnv);
    console.log(`✅ Loaded ${targetEnv} database config`);
    console.log(`   Database: ${targetDb.database} @ ${targetDb.host}`);
  } catch (error: any) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

  // Confirm dangerous operation
  if (!await confirmDangerousOperation(sourceEnv, targetEnv)) {
    console.log('\n❌ Operation cancelled\n');
    process.exit(0);
  }

  // Check if pg_dump and psql are available
  try {
    execSync('pg_dump --version', { stdio: 'ignore' });
    execSync('psql --version', { stdio: 'ignore' });
  } catch {
    console.error('\n❌ PostgreSQL client tools (pg_dump, psql) not found');
    console.log('\n📦 Install PostgreSQL client tools:');
    console.log('   - Windows: https://www.postgresql.org/download/windows/');
    console.log('   - macOS: brew install postgresql');
    console.log('   - Linux: sudo apt install postgresql-client\n');
    process.exit(1);
  }

  // Create backup of target before cloning
  const createBackupFirst = await question('\nCreate backup of target database first? [Y/n]: ');
  if (createBackupFirst.toLowerCase() !== 'n') {
    try {
      await createBackup(targetDb, `${targetEnv}-before-clone`);
    } catch (error) {
      console.log('\n⚠️  Backup failed. Continue anyway? [y/N]: ');
      const continueAnyway = await question('');
      if (continueAnyway.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled\n');
        process.exit(0);
      }
    }
  }

  // Perform clone
  try {
    await cloneDatabase(sourceDb, targetDb);

    console.log('✨ Database clone completed successfully!\n');
    console.log(`📊 ${sourceEnv} → ${targetEnv}`);
    console.log('\n💡 Next steps:');
    console.log('   - Verify data in target database');
    console.log('   - Run any necessary migrations');
    console.log('   - Update application config if needed\n');
  } catch (error) {
    console.error('\n❌ Clone operation failed');
    process.exit(1);
  }

  rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
