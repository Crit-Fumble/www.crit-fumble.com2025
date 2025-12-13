#!/usr/bin/env tsx
/**
 * Development Tunnel Script
 *
 * Starts both the SSH tunnel to Core API and the Next.js dev server.
 * Uses local .env files for configuration.
 *
 * Configuration:
 * Set CORE_DROPLET in .env.local to specify the droplet name or IP.
 *
 * Usage:
 *   npm run dev:tunnel
 *
 * Environment Variables:
 *   CORE_DROPLET     - Droplet name for doclt or IP for direct SSH (required)
 *   TUNNEL_PORT      - Local port for tunnel (default: 9000)
 *   TUNNEL_MODE      - "doclt" | "ssh" (default: "doclt")
 *   TUNNEL_SSH_KEY   - Path to SSH key for direct SSH mode
 */

import { spawn, ChildProcess } from 'child_process'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

// Load environment from .env.local (or .env if .env.local doesn't exist)
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath })
  console.log('[tunnel] Loaded .env.local')
} else if (existsSync(envPath)) {
  config({ path: envPath })
  console.log('[tunnel] Loaded .env')
}

const CORE_DROPLET = process.env.CORE_DROPLET
const TUNNEL_PORT = process.env.TUNNEL_PORT || '9000'
const TUNNEL_MODE = process.env.TUNNEL_MODE || 'doclt'
const TUNNEL_SSH_KEY = process.env.TUNNEL_SSH_KEY
const CORE_REMOTE_PORT = process.env.CORE_REMOTE_PORT || '3000'

if (!CORE_DROPLET) {
  console.error(`
[tunnel] ERROR: CORE_DROPLET is not set.

Add to your .env.local:
  CORE_DROPLET=<droplet-name-or-ip>

Examples:
  CORE_DROPLET=core-droplet          # For doclt mode
  CORE_DROPLET=157.245.xxx.xxx       # For direct SSH mode
  TUNNEL_MODE=ssh                    # Use direct SSH instead of doclt
  TUNNEL_SSH_KEY=~/.ssh/id_rsa       # SSH key for direct mode
`)
  process.exit(1)
}

let tunnelProcess: ChildProcess | null = null
let devProcess: ChildProcess | null = null
let isShuttingDown = false

function cleanup() {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log('\n[tunnel] Shutting down...')

  if (devProcess && !devProcess.killed) {
    console.log('[tunnel] Stopping dev server...')
    devProcess.kill('SIGTERM')
  }

  if (tunnelProcess && !tunnelProcess.killed) {
    console.log('[tunnel] Closing SSH tunnel...')
    tunnelProcess.kill('SIGTERM')
  }

  // Force exit after timeout
  setTimeout(() => {
    console.log('[tunnel] Force exit')
    process.exit(0)
  }, 3000)
}

// Handle shutdown signals
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.on('exit', cleanup)

function startTunnel(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    let cmd: string
    let args: string[]

    if (TUNNEL_MODE === 'ssh') {
      // Direct SSH mode
      cmd = 'ssh'
      args = [
        '-N', // No command execution
        '-L', `${TUNNEL_PORT}:localhost:${CORE_REMOTE_PORT}`,
      ]
      if (TUNNEL_SSH_KEY) {
        args.push('-i', TUNNEL_SSH_KEY)
      }
      args.push(`root@${CORE_DROPLET}`)
    } else {
      // doclt mode (DigitalOcean CLI)
      cmd = 'doclt'
      args = [
        'compute', 'ssh',
        CORE_DROPLET!,
        '-L', `${TUNNEL_PORT}:localhost:${CORE_REMOTE_PORT}`,
      ]
    }

    console.log(`[tunnel] Starting SSH tunnel: ${cmd} ${args.join(' ')}`)
    console.log(`[tunnel] Forwarding localhost:${TUNNEL_PORT} -> Core:${CORE_REMOTE_PORT}`)

    const tunnel = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    })

    tunnelProcess = tunnel

    tunnel.stdout?.on('data', (data) => {
      const str = data.toString().trim()
      if (str) console.log(`[tunnel:ssh] ${str}`)
    })

    tunnel.stderr?.on('data', (data) => {
      const str = data.toString().trim()
      if (str) console.log(`[tunnel:ssh] ${str}`)
    })

    tunnel.on('error', (err) => {
      console.error(`[tunnel] SSH tunnel error:`, err.message)
      reject(err)
    })

    tunnel.on('exit', (code) => {
      if (!isShuttingDown) {
        console.error(`[tunnel] SSH tunnel exited with code ${code}`)
        cleanup()
      }
    })

    // Give tunnel a moment to establish
    setTimeout(() => {
      if (!tunnel.killed) {
        console.log('[tunnel] SSH tunnel established')
        resolve(tunnel)
      }
    }, 2000)
  })
}

function startDevServer(): ChildProcess {
  console.log('[tunnel] Starting Next.js dev server...')

  // Use npm run dev but skip the tunnel script
  const dev = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      // Ensure CORE_API_URL points to tunnel
      CORE_API_URL: `http://localhost:${TUNNEL_PORT}`,
    },
  })

  devProcess = dev

  dev.stdout?.on('data', (data) => {
    process.stdout.write(data)
  })

  dev.stderr?.on('data', (data) => {
    process.stderr.write(data)
  })

  dev.on('error', (err) => {
    console.error(`[tunnel] Dev server error:`, err.message)
  })

  dev.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`[tunnel] Dev server exited with code ${code}`)
      cleanup()
    }
  })

  return dev
}

async function main() {
  console.log(`
========================================
  Crit-Fumble Dev Tunnel
========================================
  Mode:        ${TUNNEL_MODE}
  Droplet:     ${CORE_DROPLET}
  Tunnel Port: ${TUNNEL_PORT}
  Core Port:   ${CORE_REMOTE_PORT}
========================================
`)

  try {
    await startTunnel()
    startDevServer()

    console.log(`
[tunnel] Ready!
[tunnel] Core API available at: http://localhost:${TUNNEL_PORT}
[tunnel] Dev server at: http://localhost:3000
[tunnel] Press Ctrl+C to stop
`)
  } catch (error) {
    console.error('[tunnel] Failed to start:', error)
    cleanup()
    process.exit(1)
  }
}

main()
