#!/usr/bin/env tsx
/**
 * Setup Production Database
 *
 * This script helps you create and configure a production PostgreSQL database
 * on DigitalOcean and updates your .env.production.local file.
 *
 * Prerequisites:
 * - doctl installed and authenticated (https://docs.digitalocean.com/reference/doctl/)
 * - DO_API_TOKEN in your .env file
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function findDoctl(): string | null {
  // Check environment variable first
  if (process.env.DOCTL_PATH) {
    return process.env.DOCTL_PATH;
  }

  // Common installation paths
  const commonPaths = [
    'doctl', // In PATH
    'C:\\Program Files\\doctl\\doctl.exe',
    'C:\\Program Files (x86)\\doctl\\doctl.exe',
    path.join(process.env.LOCALAPPDATA || '', 'doctl', 'doctl.exe'),
    path.join(process.env.USERPROFILE || '', '.local', 'bin', 'doctl.exe'),
  ];

  for (const doctlPath of commonPaths) {
    try {
      execSync(`"${doctlPath}" version`, { stdio: 'ignore' });
      return doctlPath;
    } catch {
      continue;
    }
  }

  return null;
}

async function checkDoctl(): Promise<string | null> {
  const doctlPath = findDoctl();
  if (doctlPath) {
    console.log(`✅ Found doctl at: ${doctlPath}\n`);
    return doctlPath;
  }
  return null;
}

async function listDatabases(doctlPath: string) {
  console.log('\n📊 Fetching your existing databases...\n');
  try {
    const output = execSync(`"${doctlPath}" databases list --format ID,Name,Engine,Status,Region`, {
      encoding: 'utf-8'
    });
    console.log(output);
    return true;
  } catch (error) {
    console.error('❌ Failed to list databases. Make sure doctl is authenticated.');
    return false;
  }
}

async function createDatabase(doctlPath: string) {
  console.log('\n🏗️  Creating new PostgreSQL database...\n');

  const name = await question('Database name (e.g., critfumble-prod): ');
  const region = await question('Region [nyc3]: ') || 'nyc3';
  const size = await question('Size [db-s-1vcpu-1gb]: ') || 'db-s-1vcpu-1gb';

  console.log('\n⏳ Creating database (this may take several minutes)...\n');

  try {
    const output = execSync(
      `"${doctlPath}" databases create ${name} --engine pg --region ${region} --size ${size} --num-nodes 1 --version 16 --json`,
      { encoding: 'utf-8' }
    );

    const db = JSON.parse(output)[0];
    console.log('✅ Database created!\n');
    console.log(`   ID: ${db.id}`);
    console.log(`   Name: ${db.name}`);
    console.log(`   Status: ${db.status}`);

    return db.id;
  } catch (error) {
    console.error('❌ Failed to create database:', error);
    return null;
  }
}

async function getConnectionString(doctlPath: string, dbId: string): Promise<string | null> {
  console.log('\n🔌 Fetching connection details...\n');

  try {
    // Wait for database to be ready
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const output = execSync(`"${doctlPath}" databases get ${dbId} --json`, {
        encoding: 'utf-8'
      });

      const db = JSON.parse(output)[0];

      if (db.status === 'online') {
        console.log('✅ Database is online!\n');

        // Get connection details
        const connOutput = execSync(`"${doctlPath}" databases connection ${dbId} --json`, {
          encoding: 'utf-8'
        });

        const conn = JSON.parse(connOutput)[0];

        // Build connection string with pooling
        const connectionString = `postgresql://${conn.user}:${conn.password}@${conn.host}:${conn.port}/${conn.database}?sslmode=require&connection_limit=5&pool_timeout=10`;

        console.log('📋 Connection Details:');
        console.log(`   Host: ${conn.host}`);
        console.log(`   Port: ${conn.port}`);
        console.log(`   Database: ${conn.database}`);
        console.log(`   User: ${conn.user}`);
        console.log(`   SSL: Required`);
        console.log(`   Connection Pooling: Enabled (limit=5)\n`);

        return connectionString;
      }

      console.log(`⏳ Waiting for database to come online... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    }

    console.error(`❌ Database did not come online in time. Check manually with: "${doctlPath}" databases get ` + dbId);
    return null;
  } catch (error) {
    console.error('❌ Failed to get connection details:', error);
    return null;
  }
}

async function updateEnvFile(connectionString: string) {
  const envPath = path.join(process.cwd(), '.env.production.local');

  let envContent = '';

  if (fs.existsSync(envPath)) {
    console.log('\n📝 Updating existing .env.production.local...\n');
    envContent = fs.readFileSync(envPath, 'utf-8');

    // Update DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(
        /DATABASE_URL=.*/,
        `DATABASE_URL="${connectionString}"`
      );
    } else {
      envContent += `\nDATABASE_URL="${connectionString}"\n`;
    }
  } else {
    console.log('\n📝 Creating .env.production.local...\n');
    envContent = `# Production Environment Variables\nDATABASE_URL="${connectionString}"\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log('✅ Updated .env.production.local\n');
}

async function main() {
  console.log('🚀 DigitalOcean Production Database Setup\n');
  console.log('This script will help you create and configure a production PostgreSQL database.\n');

  // Check if doctl is installed
  const doctlPath = await checkDoctl();
  if (!doctlPath) {
    console.error('❌ doctl is not installed or not in PATH');
    console.log('\n📦 Install doctl:');
    console.log('   https://docs.digitalocean.com/reference/doctl/how-to/install/\n');
    console.log('   After installation, authenticate with: doctl auth init\n');
    console.log('💡 Tip: On Windows, you may need to restart your terminal after installation\n');
    console.log('   Or set DOCTL_PATH environment variable to the full path\n');
    process.exit(1);
  }

  // List existing databases
  const canList = await listDatabases(doctlPath);
  if (!canList) {
    console.log(`\n💡 Authenticate with: "${doctlPath}" auth init\n`);
    process.exit(1);
  }

  // Ask if user wants to create new or use existing
  const action = await question('\nDo you want to (c)reate new database or use (e)xisting? [c/e]: ');

  let dbId: string | null = null;

  if (action.toLowerCase() === 'c') {
    dbId = await createDatabase(doctlPath);
    if (!dbId) {
      process.exit(1);
    }
  } else {
    dbId = await question('Enter database ID: ');
  }

  // Get connection string
  const connectionString = await getConnectionString(doctlPath, dbId);
  if (!connectionString) {
    process.exit(1);
  }

  // Update .env file
  await updateEnvFile(connectionString);

  console.log('✨ Setup complete!\n');
  console.log('Next steps:');
  console.log('   1. Review .env.production.local');
  console.log('   2. Run migrations: npm run db:migrate:prod');
  console.log('   3. (Optional) Clone dev data: npm run db:clone:dev-to-prod\n');

  rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
