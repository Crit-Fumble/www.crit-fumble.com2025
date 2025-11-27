# Security Review - @crit-fumble/foundryvtt-server Package

**Date:** January 26, 2025
**Package:** @crit-fumble/foundryvtt-server
**Status:** NOT IMPLEMENTED - Stub/Placeholder Only

---

## Executive Summary

The foundryvtt-server package is currently a **placeholder with no implementation**. Only package.json and README exist - no source code has been written.

### Security Status: ✅ N/A - NO CODE TO REVIEW

- ✅ No eval() usage (no code exists)
- ✅ No new Function() usage (no code exists)
- ✅ No security vulnerabilities (no code exists)

---

## Package Purpose (Planned)

**@crit-fumble/foundryvtt-server** is intended to provide system-level utilities for managing Foundry VTT instances:
- Docker container lifecycle management
- SQLite database backup/restore
- Resource monitoring
- Health checking
- Log aggregation
- Process management

---

## Current Status

**Files Present:**
- `package.json` - Declares dependencies (better-sqlite3, dockerode)
- `README.md` - Documents intended API

**Files Missing:**
- No source code
- No TypeScript files
- No implementation

**This is a stub for future development.**

---

## Critical Security Recommendations for Future Implementation

When this package is implemented, it will have **HIGH SECURITY REQUIREMENTS** because it manages system-level resources. Follow these guidelines:

### 1. Docker Socket Security 🔒 CRITICAL

**Risk:** Docker socket access = root-level system access

```typescript
import Docker from 'dockerode'

// ✅ Secure Docker configuration
const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  // NEVER expose Docker socket over HTTP without TLS
})

// Validate all container operations
async function validateContainerOperation(operation: string, user: User) {
  // Require authentication
  if (!user || !user.isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Log all Docker operations for audit
  await auditLog.create({
    userId: user.id,
    action: `docker.${operation}`,
    timestamp: new Date()
  })
}
```

### 2. SQLite Database Access 🗄️ CRITICAL

**Risk:** Direct database access can corrupt Foundry data

```typescript
import Database from 'better-sqlite3'
import path from 'path'

// ✅ Secure database operations
function openDatabase(worldId: string, mode: 'readonly' | 'readwrite' = 'readonly') {
  // Validate worldId (prevent path traversal)
  if (!/^[a-zA-Z0-9-_]+$/.test(worldId)) {
    throw new Error('Invalid world ID')
  }

  // Construct safe path
  const dbPath = path.join(
    process.env.FOUNDRY_DATA_PATH || '/foundry/data',
    'worlds',
    worldId,
    'data',
    worldId + '.db'
  )

  // Verify path is within allowed directory
  const resolvedPath = path.resolve(dbPath)
  const allowedBase = path.resolve(process.env.FOUNDRY_DATA_PATH || '/foundry/data')

  if (!resolvedPath.startsWith(allowedBase)) {
    throw new Error('Path traversal attempt blocked')
  }

  // Open with appropriate mode
  const db = new Database(dbPath, {
    readonly: mode === 'readonly',
    fileMustExist: true
  })

  return db
}
```

### 3. File System Operations 📁 CRITICAL

**Risk:** Unrestricted file access could delete/corrupt game data

```typescript
import fs from 'fs/promises'

// ✅ Validate all file paths
function validateFilePath(filePath: string, operation: 'read' | 'write' | 'delete'): string {
  // Resolve to absolute path
  const absolute = path.resolve(filePath)

  // Define allowed directories
  const allowedDirs = {
    read: ['/foundry/data', '/backups'],
    write: ['/backups', '/temp'],
    delete: ['/backups/temp']  // Very restricted
  }

  // Check if operation is allowed in this directory
  const allowed = allowedDirs[operation].some(dir =>
    absolute.startsWith(path.resolve(dir))
  )

  if (!allowed) {
    throw new Error(`Operation ${operation} not allowed for path: ${filePath}`)
  }

  return absolute
}

// Example backup function
async function backupDatabase(worldId: string, backupPath: string) {
  const sourcePath = validateFilePath(`/foundry/data/worlds/${worldId}/${worldId}.db`, 'read')
  const destPath = validateFilePath(backupPath, 'write')

  // Copy with error handling
  try {
    await fs.copyFile(sourcePath, destPath)
    await fs.chmod(destPath, 0o444)  // Read-only backup
  } catch (error) {
    console.error(`Backup failed:`, error)
    throw error
  }
}
```

### 4. Container Lifecycle Security 🐳 CRITICAL

**Risk:** Malicious containers could escape or access host system

```typescript
// ✅ Secure container configuration
async function createFoundryContainer(config: ContainerConfig) {
  // Validate license key format (prevent injection)
  if (!/^[A-Z0-9-]+$/.test(config.licenseKey)) {
    throw new Error('Invalid license key format')
  }

  // Create with security constraints
  const container = await docker.createContainer({
    Image: 'felddy/foundryvtt:release',
    name: `foundry-${config.worldId}`,

    // Security options
    HostConfig: {
      // Limit resources
      Memory: 2 * 1024 * 1024 * 1024,  // 2GB
      CpuQuota: 100000,  // 100% of one CPU

      // Read-only root filesystem
      ReadonlyRootfs: true,

      // Drop all capabilities
      CapDrop: ['ALL'],

      // No privileged mode
      Privileged: false,

      // Restrict network access
      NetworkMode: 'bridge',

      // Volume mounts (read-only where possible)
      Binds: [
        `${config.dataPath}:/data:rw`,  // Data needs write
        `${config.configPath}:/config:ro`  // Config is read-only
      ],

      // Security options
      SecurityOpt: [
        'no-new-privileges',
        'seccomp=default'
      ]
    },

    // Environment variables (sanitized)
    Env: [
      `FOUNDRY_LICENSE_KEY=${config.licenseKey}`,
      `FOUNDRY_ADMIN_KEY=${crypto.randomBytes(32).toString('hex')}`,
      `FOUNDRY_HOSTNAME=${config.hostname}`,
      'FOUNDRY_MINIFY_STATIC_FILES=true',
      'FOUNDRY_UPNP=false'  // Disable UPnP for security
    ],

    // Port mapping
    ExposedPorts: {
      '30000/tcp': {}
    },
    PortBindings: {
      '30000/tcp': [{ HostPort: String(config.port) }]
    }
  })

  return container
}
```

### 5. Health Monitoring Security 📊

```typescript
// ✅ Secure health monitoring
interface HealthCheck {
  worldId: string
  status: 'healthy' | 'unhealthy' | 'starting'
  checks: {
    containerRunning: boolean
    databaseAccessible: boolean
    httpResponsive: boolean
    memoryUsage: number
    cpuUsage: number
  }
}

async function getHealth(worldId: string): Promise<HealthCheck> {
  // Validate world ID
  if (!/^[a-zA-Z0-9-_]+$/.test(worldId)) {
    throw new Error('Invalid world ID')
  }

  const container = docker.getContainer(`foundry-${worldId}`)

  // Get container stats (safe, read-only operation)
  const stats = await container.stats({ stream: false })

  return {
    worldId,
    status: 'healthy',
    checks: {
      containerRunning: (await container.inspect()).State.Running,
      databaseAccessible: await checkDatabaseAccessible(worldId),
      httpResponsive: await checkHttpResponsive(worldId),
      memoryUsage: stats.memory_stats.usage,
      cpuUsage: calculateCpuUsage(stats)
    }
  }
}
```

### 6. Log Collection Security 📝

```typescript
// ✅ Secure log collection
async function getLogs(worldId: string, options: LogOptions) {
  // Validate world ID
  if (!/^[a-zA-Z0-9-_]+$/.test(worldId)) {
    throw new Error('Invalid world ID')
  }

  // Limit log size to prevent DOS
  const maxLines = Math.min(options.tail || 100, 1000)

  const container = docker.getContainer(`foundry-${worldId}`)

  const logs = await container.logs({
    stdout: true,
    stderr: true,
    tail: maxLines,
    timestamps: true
  })

  // Sanitize logs (remove sensitive data)
  const sanitized = logs
    .toString()
    .split('\n')
    .map(line => {
      // Remove license keys
      return line.replace(/FOUNDRY_LICENSE_KEY=[A-Z0-9-]+/g, 'FOUNDRY_LICENSE_KEY=***')
    })
    .join('\n')

  return sanitized
}
```

### 7. Authentication & Authorization 🔐 CRITICAL

```typescript
// ALL operations must require authentication

import { auth } from '@crit-fumble/lib'

export async function POST(request: Request) {
  // Authenticate
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Authorize (admin only)
  if (!session.user.role?.includes('admin')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse request
  const body = await request.json()

  // Validate input
  if (!body.worldId || !/^[a-zA-Z0-9-_]+$/.test(body.worldId)) {
    return Response.json({ error: 'Invalid world ID' }, { status: 400 })
  }

  // Audit log
  await auditLog.create({
    userId: session.user.id,
    action: 'docker.container.create',
    worldId: body.worldId,
    timestamp: new Date()
  })

  // Execute operation
  try {
    const result = await createFoundryContainer(body)
    return Response.json(result)
  } catch (error) {
    console.error('Container creation failed:', error)
    return Response.json(
      { error: 'Container creation failed' },
      { status: 500 }
    )
  }
}
```

---

## Recommendations Summary

| Priority | Recommendation | Risk if Ignored |
|----------|---------------|-----------------|
| CRITICAL | Validate all file paths | Path traversal, data corruption |
| CRITICAL | Secure Docker operations | Root-level system compromise |
| CRITICAL | Require authentication | Unauthorized access |
| CRITICAL | Audit all operations | No accountability |
| HIGH | Resource limits on containers | Resource exhaustion |
| HIGH | Read-only mounts where possible | Data corruption |
| HIGH | Sanitize logs | Credential leaks |
| MEDIUM | Health monitoring | Undetected failures |

---

## Conclusion

The **@crit-fumble/foundryvtt-server** package will require **extreme security care** when implemented because it manages system-level resources (Docker, file system, databases).

**Current Status:** ✅ Safe (no code exists)

**When Implementing:**
1. ⚠️ **Require admin authentication for ALL operations**
2. ⚠️ **Validate ALL inputs (world IDs, paths, container configs)**
3. ⚠️ **Audit log ALL Docker/file operations**
4. ⚠️ **Never use eval() or dynamic code execution**
5. ⚠️ **Implement comprehensive security testing**
6. ⚠️ **Code review by security expert before deployment**

**This package should be considered HIGH RISK when implemented.**

---

*Review performed by: Claude AI Code Assistant*
*Date: January 26, 2025*
