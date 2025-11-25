# @crit-fumble/foundryvtt-server

System-level server utilities for managing Foundry VTT instances.

## Purpose

This package provides server-side utilities that operate **outside** of Foundry modules, at the system/container level:

- Instance lifecycle management
- Docker container orchestration
- Health monitoring
- Backup/restore automation
- Resource management
- Log aggregation

## Why Separate from Modules?

Foundry modules run **inside** the Foundry process. This package runs **outside**, allowing:

- ✅ Start/stop Foundry processes
- ✅ Monitor resource usage
- ✅ Access system-level features
- ✅ Manage Docker containers
- ✅ Perform operations while Foundry is offline

## Features

### Instance Management
- Start/stop/restart Foundry processes
- Process health monitoring
- Resource limits enforcement
- Crash recovery

### Database Management
- SQLite backup/restore
- Sync coordination
- Database file management
- Migration utilities

### Docker Integration
- Container lifecycle
- Volume management
- Network configuration
- Log collection

## Installation

```bash
cd src/packages/foundryvtt-server
npm install
npm run build
```

## Usage

### Instance Lifecycle

```typescript
import { FoundryServerManager } from '@crit-fumble/foundryvtt-server';

const manager = new FoundryServerManager();

// Start instance
await manager.startInstance({
  worldId: 'campaign-123',
  port: 30000,
  dataPath: '/foundry/data'
});

// Monitor health
const health = await manager.getHealth('campaign-123');
console.log(health);

// Stop instance
await manager.stopInstance('campaign-123');
```

### Database Backup

```typescript
import { DatabaseManager } from '@crit-fumble/foundryvtt-server';

const dbManager = new DatabaseManager();

// Backup SQLite to file
await dbManager.backup('campaign-123', '/backups/campaign-123.db');

// Restore from backup
await dbManager.restore('campaign-123', '/backups/campaign-123.db');

// Sync to PostgreSQL
await dbManager.syncToPostgreSQL('campaign-123');
```

### Docker Management

```typescript
import { DockerManager } from '@crit-fumble/foundryvtt-server';

const docker = new DockerManager();

// Create container
const container = await docker.createFoundryContainer({
  worldId: 'campaign-123',
  licenseKey: process.env.FOUNDRY_LICENSE_KEY,
  port: 30000
});

// Start container
await container.start();

// Get logs
const logs = await container.getLogs();

// Stop and remove
await container.stop();
await container.remove();
```

## API Reference

See [API.md](./API.md) for complete API documentation.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Test
npm test
```

## License

MIT
