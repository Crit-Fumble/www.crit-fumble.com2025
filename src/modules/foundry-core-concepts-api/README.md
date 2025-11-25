# Foundry Core Concepts API Module

Exposes Core Concepts data via REST API for external integration.

## Overview

This module provides three modes for accessing Core Concepts data:

1. **Disabled** - No API access (default)
2. **Built-in Server** - Runs a separate Express server on a configurable port (recommended for Crit-Fumble platform)
3. **External API** - Connects to your custom API endpoint on any domain/infrastructure

### Why a Separate Express Server?

The built-in mode creates a **separate HTTP server** (not using Foundry's internal server) because:

- **Clean Separation**: API traffic doesn't interfere with VTT gameplay traffic
- **Security**: Can bind to localhost only, use different authentication than Foundry
- **Performance**: Dedicated server for data queries
- **Flexibility**: Full control over middleware, CORS, rate limiting
- **Port Isolation**: Can firewall API port (30001) separately from Foundry VTT port (30000)

This allows external applications (like the Crit-Fumble platform) to access game data without affecting Foundry's core functionality.

## Features

- ✅ Three operational modes (Disabled, Built-in, External)
- ✅ RESTful API for all 21 Core Concepts
- ✅ Bearer token authentication
- ✅ CORS support for web applications
- ✅ Full API client for external endpoints
- ✅ Custom API implementation support
- ✅ Rate limiting and security controls

## Installation

### For Crit-Fumble Platform

This module is automatically installed in Crit-Fumble Foundry instances.

### For Manual Installation

1. Copy this directory to your Foundry `Data/modules/` folder
2. Install dependencies:
   ```bash
   cd Data/modules/foundry-api-control
   npm install
   ```
3. Launch Foundry and enable the module in Module Management

## Configuration

### Module Settings (in Foundry)

- **API Mode**: Choose between Disabled, Built-in Server, or External API
- **External API URL**: URL of custom API endpoint (for external mode)
- **API Port**: Port for built-in API server (default: 30001)
- **Authentication Token**: Bearer token for API requests
- **Enable CORS**: Allow cross-origin requests
- **Rate Limiting**: Limit requests per minute
- **Debug Mode**: Enable detailed logging

### Environment Variables (Recommended)

```bash
# API Configuration
FOUNDRY_API_PORT=30001
FOUNDRY_API_TOKEN=your-secure-token-here

# Will override module settings
```

## API Documentation

### Authentication

All requests (except `/health`) require a Bearer token:

```bash
curl -H "Authorization: Bearer your-token" http://localhost:30001/world
```

### Endpoints

#### Health & Info
- `GET /health` - Health check (no auth required)
- `GET /world` - World information

#### Actors
- `GET /actors` - List all actors
- `GET /actors/:id` - Get actor by ID
- `POST /actors` - Create new actor
- `PATCH /actors/:id` - Update actor
- `DELETE /actors/:id` - Delete actor

#### Items
- `GET /items` - List all items
- `GET /items/:id` - Get item by ID
- `POST /items` - Create new item

#### Scenes
- `GET /scenes` - List all scenes
- `GET /scenes/:id` - Get scene by ID
- `POST /scenes/:id/activate` - Activate scene

#### Combat
- `GET /combats` - List all combats
- `GET /combats/:id` - Get combat by ID
- `POST /combats/:id/start` - Start combat
- `POST /combats/:id/next` - Next turn

#### Chat
- `POST /chat` - Send chat message

#### Compendia
- `GET /compendia` - List all compendium packs
- `GET /compendia/:id` - Get compendium contents

#### Users
- `GET /users` - List all users

#### Advanced
- `POST /macros/execute` - Execute JavaScript code
- `POST /query` - Query documents with filter

## Usage Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:30001',
  headers: { 'Authorization': 'Bearer your-token' }
});

// Get all actors
const actors = await api.get('/actors');
console.log(actors.data);

// Create new actor
const actor = await api.post('/actors', {
  name: 'Gandalf',
  type: 'character',
  data: {
    details: { race: 'Maiar' },
    attributes: { hp: { value: 100, max: 100 } }
  }
});

// Send chat message
await api.post('/chat', {
  content: 'The adventure begins!',
  type: 1  // OOC message
});
```

### cURL

```bash
# Health check
curl http://localhost:30001/health

# Get world info
curl -H "Authorization: Bearer token" http://localhost:30001/world

# List actors
curl -H "Authorization: Bearer token" http://localhost:30001/actors

# Create actor
curl -X POST -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"character"}' \
  http://localhost:30001/actors

# Send chat message
curl -X POST -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!"}' \
  http://localhost:30001/chat

# Execute script
curl -X POST -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"script":"game.actors.size"}' \
  http://localhost:30001/macros/execute
```

### Python

```python
import requests

API_URL = 'http://localhost:30001'
TOKEN = 'your-token'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# Get actors
response = requests.get(f'{API_URL}/actors', headers=headers)
actors = response.json()['actors']

# Create actor
actor_data = {
    'name': 'Frodo',
    'type': 'character'
}
response = requests.post(f'{API_URL}/actors', json=actor_data, headers=headers)
actor = response.json()
```

## Security

### Best Practices

1. **Use Strong Tokens**: Generate random, long tokens
   ```bash
   # Generate secure token
   openssl rand -hex 32
   ```

2. **Restrict CORS**: Only allow trusted origins
   ```
   https://crit-fumble.com,https://app.crit-fumble.com
   ```

3. **Private Network**: Run API on private network if possible

4. **HTTPS**: Use reverse proxy (nginx/Caddy) with SSL in production

5. **Monitor Access**: Enable debug mode to log all API requests

### Example nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name foundry-api.crit-fumble.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://localhost:30001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### API Not Starting

**Check module is enabled:**
1. Open Foundry
2. Go to Module Management
3. Verify "Foundry API Control" is checked

**Check port availability:**
```bash
# Windows
netstat -ano | findstr :30001

# Linux/Mac
lsof -i :30001
```

**Check logs:**
Open browser console (F12) and look for `[API]` messages

### Authentication Failures

**Verify token:**
- Check token matches in settings and request
- Ensure `Authorization: Bearer <token>` format
- No extra spaces or characters

### CORS Errors

**Add your origin:**
1. Foundry Settings → Module Settings → Foundry API Control
2. Add your origin to "Allowed Origins"
3. Restart Foundry

## Development

### Project Structure

```
foundry-api-control/
├── module.json              # Module manifest
├── README.md                # This file
├── scripts/
│   ├── init.mjs            # Module initialization
│   └── api-router.mjs      # Express API routes
└── package.json            # Dependencies
```

### Adding New Endpoints

Edit `scripts/api-router.mjs`:

```javascript
registerRoutes() {
  // ... existing routes

  // Add new endpoint
  this.app.get('/custom-endpoint', async (req, res) => {
    try {
      // Your logic here
      const data = await getSomeData();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
```

## License

MIT - See LICENSE file

## Support

- **Issues**: [GitHub Issues](https://github.com/crit-fumble/foundry-api-control/issues)
- **Discord**: [Crit-Fumble Discord](https://discord.gg/crit-fumble)

---

**Version**: 0.1.0
**Compatibility**: Foundry VTT 11+
**Last Updated**: 2025-11-19
