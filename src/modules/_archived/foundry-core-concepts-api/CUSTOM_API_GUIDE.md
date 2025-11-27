# Custom API Implementation Guide

This guide explains how to build your own Core Concepts API implementation on your own domain/infrastructure.

---

## Overview

The `foundry-core-concepts-api` module supports three modes:

1. **Disabled** - No API access
2. **Built-in Server** - Run Express API inside Foundry VTT (default for Crit-Fumble)
3. **External API** - Connect Foundry to your custom API endpoint ✨

---

## Why Use External API Mode?

- **Custom Infrastructure**: Use your preferred hosting, database, and stack
- **Data Sovereignty**: Keep all data on your own servers
- **Custom Logic**: Implement business rules specific to your application
- **Scalability**: Scale independently of Foundry VTT instances
- **Integration**: Connect to existing systems and databases

---

## Configuration

### In Foundry VTT

1. Enable the `foundry-core-concepts-api` module
2. Go to **Module Settings** → **Core Concepts API**
3. Set **API Mode** to `External API`
4. Enter your **External API URL** (e.g., `https://api.yourdomain.com/api/rpg`)
5. (Optional) Set **API Authentication Token** if your API requires auth
6. Save and reload Foundry

### Example Settings

```
API Mode: External API - Connect to custom API endpoint
External API URL: https://api.yourdomain.com/api/rpg
API Authentication Token: your-secret-token-here
```

---

## API Endpoint Requirements

Your custom API must implement the following endpoints according to the Core Concepts schema.

### Base URL Structure

```
https://api.yourdomain.com/api/rpg/
├── attributes     GET, POST
├── types          GET, POST
├── dice           GET, POST
├── tables         GET, POST
├── books          GET, POST
├── cards          GET, POST
├── hands          GET, POST
├── decks          GET, POST
├── voxels         GET, POST
├── rules          GET, POST
├── events         GET, POST
├── goals          GET, POST
├── modes          GET, POST
├── systems        GET, POST
├── creatures      GET, POST
├── locations      GET, POST
├── objects        GET, POST
├── boards         GET, POST
├── tiles          GET, POST
├── sessions       GET, POST
└── history        GET, POST
```

### Authentication

If you set an API Token in Foundry settings, it will be sent as a Bearer token:

```
Authorization: Bearer your-secret-token-here
```

Your API should validate this token before processing requests.

---

## Endpoint Specifications

See [core-concepts-api-endpoints.md](../../../../docs/agent/core-concepts-api-endpoints.md) for complete endpoint specifications.

Each endpoint should:
- Accept the specified query parameters (for GET)
- Accept JSON body (for POST)
- Return JSON responses
- Use appropriate HTTP status codes (200, 201, 400, 401, 404, 500)
- Handle errors gracefully

###Example Response Format

```json
{
  "cards": [
    {
      "id": "uuid",
      "name": "Fireball",
      "cardType": "spell",
      "properties": {
        "level": 3,
        "school": "evocation",
        "damage": "8d6"
      }
    }
  ]
}
```

---

## Data Source Options

Your custom API can use **any** data source:

### Option 1: PostgreSQL with Prisma (Recommended)

Use the provided Prisma schema from [prisma/schema.prisma](../../../../prisma/schema.prisma):

```bash
# Copy the schema to your project
cp prisma/schema.prisma your-api-project/prisma/

# Set your DATABASE_URL
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/mydb" > .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### Option 2: MongoDB

```javascript
// Example MongoDB model
const CardSchema = new Schema({
  name: String,
  cardType: String,
  properties: Object,
  systemName: String,
  isPublic: Boolean
});

// Use in your API
const cards = await Card.find({ cardType: req.query.cardType });
res.json({ cards });
```

### Option 3: MySQL/MariaDB

Convert the Prisma schema to MySQL:

```bash
# Update datasource in schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

# Run migrations
npx prisma migrate dev
```

### Option 4: REST API Proxy

Proxy requests to another existing API:

```javascript
// Forward to existing API
app.get('/api/rpg/cards', async (req, res) => {
  const response = await fetch(`https://existing-api.com/cards?${req.query}`);
  const data = await response.json();
  res.json(data);
});
```

### Option 5: In-Memory / File-Based

For development or small deployments:

```javascript
// In-memory store
const cards = new Map();

app.post('/api/rpg/cards', (req, res) => {
  const card = { id: uuid(), ...req.body };
  cards.set(card.id, card);
  res.json(card);
});

app.get('/api/rpg/cards', (req, res) => {
  res.json({ cards: Array.from(cards.values()) });
});
```

---

## Quick Start Templates

### Node.js + Express + Prisma

```javascript
// server.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Auth middleware
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Example endpoint
app.get('/api/rpg/cards', async (req, res) => {
  const { cardType, limit = 100 } = req.query;

  const cards = await prisma.rpgCard.findMany({
    where: cardType ? { cardType } : undefined,
    take: parseInt(limit)
  });

  res.json({ cards });
});

app.post('/api/rpg/cards', async (req, res) => {
  const card = await prisma.rpgCard.create({
    data: req.body
  });
  res.json(card);
});

app.listen(3000, () => console.log('API running on port 3000'));
```

### Python + FastAPI + SQLAlchemy

```python
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

app = FastAPI()

class Card(BaseModel):
    name: str
    cardType: str
    properties: dict

@app.get("/api/rpg/cards")
async def get_cards(card_type: str = None, limit: int = 100):
    # Query your database
    cards = db.query(CardModel).filter_by(card_type=card_type).limit(limit).all()
    return {"cards": cards}

@app.post("/api/rpg/cards")
async def create_card(card: Card):
    # Create card in database
    db_card = CardModel(**card.dict())
    db.add(db_card)
    db.commit()
    return db_card
```

### Go + Gin + GORM

```go
package main

import (
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type Card struct {
    ID         string `json:"id" gorm:"primaryKey"`
    Name       string `json:"name"`
    CardType   string `json:"cardType"`
    Properties JSON   `json:"properties"`
}

func main() {
    r := gin.Default()

    r.GET("/api/rpg/cards", func(c *gin.Context) {
        var cards []Card
        db.Find(&cards)
        c.JSON(200, gin.H{"cards": cards})
    })

    r.POST("/api/rpg/cards", func(c *gin.Context) {
        var card Card
        c.BindJSON(&card)
        db.Create(&card)
        c.JSON(201, card)
    })

    r.Run(":3000")
}
```

---

## Using the API Client in Foundry

Once configured, the API client is available in Foundry:

```javascript
// Access the API client
const api = game.coreConceptsAPI.client;

// Get cards
const { cards } = await api.getCards('spell');
console.log('Spell cards:', cards);

// Roll dice
const roll = await api.rollDice('2d6+3', game.user.id, game.sessionId);
console.log('Rolled:', roll.result);

// Create a creature
const creature = await api.createCreature({
  name: 'Goblin Warrior',
  creatureType: 'npc',
  race: 'Goblin',
  level: 1
});

// Get goals
const { goals } = await api.getGoals(game.sessionId);
console.log('Active goals:', goals);
```

### API Client Methods

All Core Concept endpoints are available as methods:

- `api.getAttributes(entityType, entityId)`
- `api.updateAttributes(entityType, entityId, attributes)`
- `api.getTypes(category, limit)`
- `api.createType(typeData)`
- `api.getDiceRolls(sessionId, playerId, limit)`
- `api.rollDice(notation, playerId, sessionId, purpose)`
- `api.getTables(category, worldId, limit)`
- `api.getCards(cardType, deckId, limit)`
- `api.getModes(systemName)`
- `api.getSystems(category, isActive)`
- `api.getCreatures(creatureType, worldId, sessionId, limit)`
- `api.getLocations(locationType, worldId, parentLocationId, limit)`
- ... and more (see [api-client.mjs](scripts/api-client.mjs))

---

## Testing Your API

### 1. Test with cURL

```bash
# Test GET endpoint
curl -H "Authorization: Bearer your-token" \
  https://api.yourdomain.com/api/rpg/cards?cardType=spell

# Test POST endpoint
curl -X POST -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Card","cardType":"spell"}' \
  https://api.yourdomain.com/api/rpg/cards
```

### 2. Test in Foundry Console

```javascript
// Test API client
const api = game.coreConceptsAPI.client;

// Should return cards
await api.getCards();

// Should create a card
await api.createCard({
  name: 'Test Spell',
  cardType: 'spell',
  systemName: 'dnd5e'
});
```

---

## Production Checklist

Before deploying your custom API:

- [ ] All 21 Core Concept endpoints implemented
- [ ] Authentication middleware configured
- [ ] HTTPS/SSL enabled
- [ ] CORS configured for your Foundry domain
- [ ] Rate limiting enabled
- [ ] Error handling for all endpoints
- [ ] Database connection pooling
- [ ] Logging and monitoring
- [ ] Backup strategy for database
- [ ] Load balancing (if needed)
- [ ] API documentation for your team

---

## Example: Full Implementation with Next.js

The Crit-Fumble platform itself uses Next.js API routes. You can see the reference implementation in:

- [src/app/api/rpg/](../../../../src/app/api/rpg/) - All endpoint implementations
- [prisma/schema.prisma](../../../../prisma/schema.prisma) - Database schema
- [docs/agent/core-concepts-api-endpoints.md](../../../../docs/agent/core-concepts-api-endpoints.md) - Complete API docs

To use this as a starting point:

```bash
# Clone the repository
git clone https://github.com/crit-fumble/www.crit-fumble.com

# Install dependencies
npm install

# Set up your database
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run migrations
npx prisma migrate dev

# Start the API
npm run dev

# Your API is now at http://localhost:3000/api/rpg/
```

Then in Foundry:
- External API URL: `http://localhost:3000/api/rpg`

---

## Support

Need help implementing your custom API?

- **Example Code**: See [src/app/api/rpg/](../../../../src/app/api/rpg/)
- **Schema Reference**: See [prisma/schema.prisma](../../../../prisma/schema.prisma)
- **API Spec**: See [core-concepts-api-endpoints.md](../../../../docs/agent/core-concepts-api-endpoints.md)
- **Community**: [Discord](https://discord.gg/crit-fumble)
- **Issues**: [GitHub Issues](https://github.com/crit-fumble/www.crit-fumble.com/issues)

---

**Next Steps:**
1. Set up your database
2. Implement the 21 Core Concept endpoints
3. Deploy to your hosting provider
4. Configure Foundry to use your API
5. Test thoroughly!
