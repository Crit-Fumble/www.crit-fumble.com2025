#!/usr/bin/env tsx
/**
 * FumbleBot Database Setup
 *
 * Creates a PostgreSQL database on DigitalOcean for FumbleBot.
 * This is independent from the main website database.
 *
 * Prerequisites:
 * - doctl installed and authenticated (https://docs.digitalocean.com/reference/doctl/)
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageRoot = path.resolve(__dirname, '..')
const projectRoot = path.resolve(packageRoot, '..', '..', '..', '..')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

function findDoctl(): string | null {
  if (process.env.DOCTL_PATH) {
    return process.env.DOCTL_PATH
  }

  const commonPaths = [
    'doctl',
    'C:\\Program Files\\doctl\\doctl.exe',
    'C:\\Program Files (x86)\\doctl\\doctl.exe',
    path.join(process.env.LOCALAPPDATA || '', 'doctl', 'doctl.exe'),
    path.join(process.env.USERPROFILE || '', '.local', 'bin', 'doctl.exe'),
  ]

  for (const doctlPath of commonPaths) {
    try {
      execSync(`"${doctlPath}" version`, { stdio: 'ignore' })
      return doctlPath
    } catch {
      continue
    }
  }

  return null
}

async function checkDoctl(): Promise<string | null> {
  const doctlPath = findDoctl()
  if (doctlPath) {
    console.log(`✅ Found doctl at: ${doctlPath}\n`)
    return doctlPath
  }
  return null
}

async function listDatabases(doctlPath: string) {
  console.log('\n📊 Fetching existing databases...\n')
  try {
    const output = execSync(`"${doctlPath}" databases list --format ID,Name,Engine,Status,Region`, {
      encoding: 'utf-8',
    })
    console.log(output)
    return true
  } catch (error) {
    console.error('❌ Failed to list databases. Make sure doctl is authenticated.')
    return false
  }
}

async function createDatabase(doctlPath: string) {
  console.log('\n🏗️  Creating FumbleBot PostgreSQL database...\n')

  const name = (await question('Database name [fumblebot-prod]: ')) || 'fumblebot-prod'
  const region = (await question('Region [nyc3]: ')) || 'nyc3'
  const size = (await question('Size [db-s-1vcpu-1gb]: ')) || 'db-s-1vcpu-1gb'

  console.log('\n⏳ Creating database (this may take several minutes)...\n')

  try {
    const output = execSync(
      `"${doctlPath}" databases create ${name} --engine pg --region ${region} --size ${size} --num-nodes 1 --version 16 --json`,
      { encoding: 'utf-8' }
    )

    const db = JSON.parse(output)[0]
    console.log('✅ Database created!\n')
    console.log(`   ID: ${db.id}`)
    console.log(`   Name: ${db.name}`)
    console.log(`   Status: ${db.status}`)

    // Enable automatic backups (DO managed DBs have daily backups by default)
    console.log('\n💾 Automatic daily backups are enabled by default on DigitalOcean managed databases.')

    return db.id
  } catch (error) {
    console.error('❌ Failed to create database:', error)
    return null
  }
}

async function getConnectionString(doctlPath: string, dbId: string): Promise<string | null> {
  console.log('\n🔌 Fetching connection details...\n')

  try {
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      const output = execSync(`"${doctlPath}" databases get ${dbId} --json`, {
        encoding: 'utf-8',
      })

      const db = JSON.parse(output)[0]

      if (db.status === 'online') {
        console.log('✅ Database is online!\n')

        const connOutput = execSync(`"${doctlPath}" databases connection ${dbId} --json`, {
          encoding: 'utf-8',
        })

        const conn = JSON.parse(connOutput)[0]

        // Build connection string with pooling
        const connectionString = `postgresql://${conn.user}:${conn.password}@${conn.host}:${conn.port}/${conn.database}?sslmode=require&connection_limit=5&pool_timeout=10`

        console.log('📋 Connection Details:')
        console.log(`   Host: ${conn.host}`)
        console.log(`   Port: ${conn.port}`)
        console.log(`   Database: ${conn.database}`)
        console.log(`   User: ${conn.user}`)
        console.log(`   SSL: Required`)
        console.log(`   Connection Pooling: Enabled (limit=5)\n`)

        return connectionString
      }

      console.log(`⏳ Waiting for database to come online... (${attempts + 1}/${maxAttempts})`)
      await new Promise((resolve) => setTimeout(resolve, 10000))
      attempts++
    }

    console.error(`❌ Database did not come online in time. Check manually with: "${doctlPath}" databases get ${dbId}`)
    return null
  } catch (error) {
    console.error('❌ Failed to get connection details:', error)
    return null
  }
}

async function updateEnvFile(connectionString: string) {
  const envPath = path.join(projectRoot, '.env.fumblebot')

  let envContent = ''

  if (fs.existsSync(envPath)) {
    console.log('\n📝 Updating existing .env.fumblebot...\n')
    envContent = fs.readFileSync(envPath, 'utf-8')

    if (envContent.includes('FUMBLEBOT_DATABASE_URL=')) {
      envContent = envContent.replace(/FUMBLEBOT_DATABASE_URL=.*/, `FUMBLEBOT_DATABASE_URL="${connectionString}"`)
    } else {
      envContent += `\n# FumbleBot Database\nFUMBLEBOT_DATABASE_URL="${connectionString}"\n`
    }
  } else {
    console.log('\n📝 Creating .env.fumblebot...\n')
    envContent = `# FumbleBot Database\nFUMBLEBOT_DATABASE_URL="${connectionString}"\n`
  }

  fs.writeFileSync(envPath, envContent, 'utf-8')
  console.log('✅ Updated .env.fumblebot\n')
}

async function main() {
  console.log('🤖 FumbleBot Database Setup\n')
  console.log('This script creates a dedicated PostgreSQL database for FumbleBot on DigitalOcean.')
  console.log('The database is independent from the main crit-fumble.com website.\n')

  const doctlPath = await checkDoctl()
  if (!doctlPath) {
    console.error('❌ doctl is not installed or not in PATH')
    console.log('\n📦 Install doctl:')
    console.log('   https://docs.digitalocean.com/reference/doctl/how-to/install/\n')
    console.log('   After installation, authenticate with: doctl auth init\n')
    console.log('💡 Tip: On Windows, you may need to restart your terminal after installation\n')
    console.log('   Or set DOCTL_PATH environment variable to the full path\n')
    process.exit(1)
  }

  const canList = await listDatabases(doctlPath)
  if (!canList) {
    console.log(`\n💡 Authenticate with: "${doctlPath}" auth init\n`)
    process.exit(1)
  }

  const action = await question('\nDo you want to (c)reate new database or use (e)xisting? [c/e]: ')

  let dbId: string | null = null

  if (action.toLowerCase() === 'c') {
    dbId = await createDatabase(doctlPath)
    if (!dbId) {
      process.exit(1)
    }
  } else {
    dbId = await question('Enter database ID: ')
  }

  const connectionString = await getConnectionString(doctlPath, dbId)
  if (!connectionString) {
    process.exit(1)
  }

  await updateEnvFile(connectionString)

  console.log('✨ Setup complete!\n')
  console.log('Next steps:')
  console.log('   1. Review .env.fumblebot')
  console.log('   2. Generate Prisma client: npm run db:generate')
  console.log('   3. Run migrations: npm run db:migrate:prod')
  console.log('   4. Start FumbleBot: npm start\n')

  rl.close()
}

main().catch((error) => {
  console.error('Error:', error)
  rl.close()
  process.exit(1)
})
