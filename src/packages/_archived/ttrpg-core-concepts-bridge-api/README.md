# TTRPG Core Concepts Bridge API

> Bridge server for syncing TTRPG game state between Foundry VTT and web applications

## Overview

The Bridge API is a standalone server that acts as an intermediary between Foundry VTT instances and web applications. It provides:

- **Real-time sync** - WebSocket connections for live game state updates
- **Redis caching** - Fast access to frequently accessed game data
- **Event broadcasting** - Publish/subscribe for game events
- **API endpoints** - RESTful API for game state management

## Architecture

```
Foundry VTT Instance(s)           Web Application
        │                                │
        │  WebSocket                     │  HTTP/WebSocket
        │                                │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │  Bridge API Server      │
        │  - WebSocket Hub        │
        │  - Redis Cache          │
        │  - Event Broadcaster    │
        └────────────┬────────────┘
                     │
                     ▼
              ┌─────────────┐
              │  PostgreSQL │
              │  (via Web)  │
              └─────────────┘
```

## Features

### Core Functionality
- ✅ WebSocket server for real-time connections
- ✅ Redis for caching and pub/sub
- ✅ Event broadcasting system
- ✅ Connection management and health checks
- ✅ Automatic reconnection handling

### Game State Sync
- Character updates (HP, inventory, stats)
- Combat tracker sync
- Chat message relay
- Scene/map changes
- Token movement
- Dice roll results

### Security
- Connection authentication
- Rate limiting
- CORS configuration
- Input validation with Zod

## Installation

### Standalone Server

```bash
npm install @crit-fumble/ttrpg-core-concepts-bridge-api
```

### Docker

```bash
docker run -p 3001:3001 -p 6379:6379 \
  -e REDIS_URL=redis://localhost:6379 \
  critfumble/ttrpg-core-concepts-bridge-api
```

### From Source

```bash
cd src/packages/ttrpg-core-concepts-bridge-api
npm install
npm run build
npm start
```

## Configuration

### Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=production

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password

# CORS (comma-separated)
ALLOWED_ORIGINS=https://www.crit-fumble.com,http://localhost:3000

# WebSocket
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=1000

# Authentication
BRIDGE_API_SECRET=your_secret_here
```

## Usage

### Starting the Server

```typescript
import { createBridgeServer } from '@crit-fumble/ttrpg-core-concepts-bridge-api';

const server = createBridgeServer({
  port: 3001,
  redisUrl: 'redis://localhost:6379',
  allowedOrigins: ['https://www.crit-fumble.com']
});

await server.start();
```

### Connecting from Foundry VTT

```javascript
// In foundry-core-concepts-api module
const bridge = new CoreConceptsBridge({
  url: 'ws://bridge-server:3001',
  gameId: game.world.id,
  auth: {
    secret: 'your_secret'
  }
});

// Subscribe to events
bridge.on('character.update', (data) => {
  console.log('Character updated:', data);
});

// Publish events
bridge.publish('combat.start', {
  combatId: combat.id,
  participants: combat.combatants
});
```

### Connecting from Web App

```typescript
import { CoreConceptsWebClient } from '@crit-fumble/ttrpg-core-concepts-web-api';

const client = new CoreConceptsWebClient({
  bridgeUrl: 'https://bridge.crit-fumble.com',
  campaignId: 'campaign-123'
});

// Subscribe to game events
client.on('dice.roll', (roll) => {
  console.log('Dice rolled:', roll);
});

// Send command to game
await client.sendCommand('character.heal', {
  characterId: 'char-456',
  amount: 10
});
```

## API Reference

### WebSocket Events

#### Client → Server

```typescript
// Connect to a game session
{
  type: 'join',
  gameId: string,
  auth: { secret: string }
}

// Publish game event
{
  type: 'publish',
  event: string,
  data: any
}

// Subscribe to events
{
  type: 'subscribe',
  channels: string[]
}
```

#### Server → Client

```typescript
// Event received
{
  type: 'event',
  event: string,
  data: any,
  timestamp: string
}

// Connection acknowledged
{
  type: 'connected',
  connectionId: string
}

// Error
{
  type: 'error',
  message: string
}
```

### HTTP Endpoints

#### Health Check
```
GET /health
Response: { status: 'ok', connections: number, uptime: number }
```

#### Connection Info
```
GET /connections
Response: { count: number, games: string[] }
```

#### Publish Event (HTTP)
```
POST /publish
Body: { event: string, data: any, gameId: string }
Response: { success: boolean }
```

## Event Types

### Character Events
- `character.create` - New character created
- `character.update` - Character stats/inventory changed
- `character.delete` - Character removed
- `character.heal` - Character healed
- `character.damage` - Character took damage

### Combat Events
- `combat.start` - Combat encounter started
- `combat.end` - Combat ended
- `combat.turn` - Turn changed
- `combat.round` - New round started

### Chat Events
- `chat.message` - Chat message sent
- `chat.roll` - Dice roll in chat
- `chat.emote` - Emote action

### Scene Events
- `scene.change` - Active scene changed
- `scene.update` - Scene modified
- `token.move` - Token moved on scene
- `token.update` - Token updated

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start Redis (required)
docker run -d -p 6379:6379 redis:7-alpine

# Start dev server
npm run dev

# Run tests
npm test
```

### Building

```bash
npm run build
```

Output will be in `dist/` directory.

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test
npm test -- bridge.test.ts
```

## Deployment

### Standalone Droplet ($4/month)

```bash
# Create droplet
doctl compute droplet create crit-fumble-bridge \
  --size s-1vcpu-512mb-10gb \
  --image ubuntu-22-04-x64 \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY

# SSH and setup
ssh root@droplet-ip

# Install Docker
apt-get update && apt-get install -y docker.io

# Run Redis
docker run -d --name redis \
  --restart unless-stopped \
  -p 6379:6379 \
  redis:7-alpine

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Clone and build
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/src/packages/ttrpg-core-concepts-bridge-api
npm ci --production
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name bridge
pm2 startup
pm2 save
```

### Docker Compose

```yaml
version: '3.8'
services:
  bridge:
    build: .
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

## Monitoring

### Metrics

The bridge exposes metrics at `/metrics`:

```
bridge_connections_total
bridge_events_published_total
bridge_events_received_total
bridge_redis_operations_total
```

### Logging

Structured JSON logging:

```json
{
  "level": "info",
  "message": "Event published",
  "event": "character.update",
  "gameId": "game-123",
  "timestamp": "2025-01-21T10:30:00Z"
}
```

## Troubleshooting

### Connection Issues

```bash
# Check if bridge is running
curl http://localhost:3001/health

# Check Redis connection
redis-cli ping

# View logs
pm2 logs bridge
```

### High Memory Usage

```bash
# Check Redis memory
redis-cli INFO memory

# Clear cache if needed
redis-cli FLUSHDB
```

## Roadmap

### v0.2.0
- [ ] Persistent message queue
- [ ] Event replay functionality
- [ ] Admin dashboard

### v0.3.0
- [ ] Clustering support
- [ ] Horizontal scaling
- [ ] Load balancing

### v1.0.0
- [ ] Stable API
- [ ] Full documentation
- [ ] Production-ready

## Contributing

This package will be open-sourced once stable. Contributions welcome!

## License

MIT License - See LICENSE file for details

## Links

- [Documentation](https://docs.crit-fumble.com/bridge-api)
- [GitHub](https://github.com/crit-fumble/ttrpg-core-concepts-bridge-api)
- [NPM](https://www.npmjs.com/package/@crit-fumble/ttrpg-core-concepts-bridge-api)
