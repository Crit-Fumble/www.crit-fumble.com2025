# Foundry FumbleBot Integration Module

Version: 0.1.0 (Proof of Concept)

## Overview

This module enables integration between Foundry VTT and the FumbleBot Discord bot, allowing Discord users to interact with Foundry games through chat commands and receive real-time notifications.

## Current Status: POC (Phase 0)

This is a proof-of-concept implementation with basic health check functionality. Full features will be implemented in Phase 1.

## Installation

### For Local Testing:
1. Copy this module to your Foundry `Data/modules` directory
2. Restart Foundry VTT
3. Enable the module in your world settings
4. Test the health endpoint

### For Production (Future):
Module will be pre-installed in Docker containers via the Foundry build.

## API Endpoints (POC)

### Health Check
**Socket Event**: `module.foundry-fumblebot` with `action: 'health'`

Returns:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "foundryVersion": "13.351",
  "worldId": "world-id",
  "worldTitle": "World Name",
  "timestamp": "2025-11-27T..."
}
```

## Phase 1 Features (Planned)

- Bot user account creation
- Chat read/write endpoints
- Authentication via API key
- Permission management
- Discord channel linking

## Phase 2 Features (Planned)

- Event hooks (combat, chat, scenes)
- Real-time notifications to Discord
- Webhook support

## Phase 3 Features (Planned)

- WebSocket bidirectional communication
- Advanced bot commands
- Scene management
- Asset synchronization

## Configuration

Module settings are available in the module configuration menu:
- **Enable FumbleBot Integration**: Toggle bot access to this world
- **Bot API Key**: Auto-generated authentication key (hidden)

## Development

This module is part of the Crit-Fumble platform integration suite.

Repository: https://github.com/crit-fumble/www.crit-fumble.com

## License

Proprietary - Crit-Fumble Platform
