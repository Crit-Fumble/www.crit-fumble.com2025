# Monetization & Virtual Desktop System
## Crit-Fumble Premium Features

This document covers the dual-currency economy (Crit-Coins & Story Credits), Stripe payment integration, and GPU-powered Virtual Desktop system.

---

## Overview

### Dual Currency System

The platform uses two currencies with distinct purposes:

#### Crit-Coins (Purchased Currency)
**Purpose**: Players spend these on platform features
- Purchased with real money ($1 = 1 CC base rate, with bonuses)
- Used for: Virtual Desktop sessions, AI generation, premium features
- **Cannot be cashed out** - one-way conversion only
- When spent, converts to Story Credits for the recipient

#### Story Credits (Earned Currency)
**Purpose**: Creators and GMs earn these for their work
- Earned by: Running paid GM sessions, creating content, artwork, assets
- Can be redeemed for Crit-Coins at 10% discount
- **Can be cashed out** via Stripe at 10% platform fee
- Tracks earnings and enables creator payouts

### Flow Examples

#### GM Session Example
1. Player buys 11 Crit-Coins for $10 (Value Pack)
2. Player pays GM 20 CC for a session
3. **Conversion**: 20 CC → 20 Story Credits earned by GM
4. GM can either:
   - **Cash out**: 20 SC → $18 USD (10% platform fee via Stripe Connect)
   - **Redeem for coins**: 20 SC → 22 CC (10% discount: $20 value → $18 cost, buys $20 worth of coins at 10% off)

#### Content Creator Example
1. Artist submits character portrait artwork
2. Admin reviews and approves content
3. Artist receives 5 Story Credits
4. Artist accumulates 100 SC total
5. Artist can either:
   - **Cash out**: 100 SC → $90 USD via Stripe Connect (10% fee)
   - **Redeem**: 100 SC → Value Pack equivalent (11 CC for $10, but paying $9 = ~10 CC) + Mega Pack (29 CC for $25, paying $22.50) = Total ~110 CC for 100 SC

#### Story Credits to Crit-Coins Redemption Math
When redeeming Story Credits for Crit-Coins:
- Story Credits valued at $1 USD each (same as base CC rate)
- 10% discount applied to the USD value
- Redeemed amount can purchase any Crit-Coin package (with package bonuses)

**Example**: 50 SC → $45 purchasing power
- Can buy: Mega Pack (29 CC for $25) + Value Pack (11 CC for $10) + Starter Packs
- Total: ~45-48 CC (depending on package combinations chosen)

### Pricing Philosophy

1. **Free to Play**: Core functionality is completely free
2. **Premium Options**: Advanced features require Crit-Coins
3. **Creator Economy**: Story Credits enable content marketplace
4. **BYOK (Bring Your Own Key)**: Users can supply their own API keys
5. **Fair Pricing**: Covers costs + reasonable margin

---

## Crit-Coin Packages

**Base Value**: 1 Crit-Coin = $1.00 USD

### Standard Packages

| Package | Coins Purchased | Bonus | Total Coins | Price | Bonus % | Value per Coin |
|---------|----------------|-------|-------------|-------|---------|----------------|
| Starter Pack | 1 | 0 | 1 | $1.00 | 0% | $1.00/coin |
| Value Pack | 10 | +1 | 11 | $10.00 | 10% | $0.91/coin |
| Mega Pack | 25 | +4 | 29 | $25.00 | 16% | $0.86/coin |
| Ultra Pack | 50 | +10 | 60 | $50.00 | 20% | $0.83/coin |

### Monthly Subscriber Packages (Coming Soon)
| Package | Coins Purchased | Bonus | Total Coins | Price | Bonus % | Value per Coin |
|---------|----------------|-------|-------------|-------|---------|----------------|
| Starter | 1 | 0 | 1 | $1.00 | 0% | $1.00/coin |
| Value | 10 | +2 | 12 | $10.00 | 20% | $0.83/coin |
| Mega | 25 | +6 | 31 | $25.00 | 24% | $0.81/coin |
| Ultra | 50 | +13 | 63 | $50.00 | 26% | $0.79/coin |

### Physical Products (Future)
- Cards
- Game Boards
- Battlemats
- Sheets
- Tokens
- Miniatures
- Dice
- Books
- Card Connectors / Building Sets
- Mini-PC (VTT-compatible)
- Tablet-PC (Player VTT-compatible)
- Web-book Laptop (VTT-compatible)
- Mugs
- Shirts

> coming soon...

### Live GM Sessions (Paid Games Marketplace)

GMs can set their own hourly rates and run paid sessions. Players pay in Crit-Coins, which convert to Story Credits for the GM.

#### How It Works

1. **GMs Set Their Rate**: GMs choose their hourly rate in Crit-Coins
2. **Players Book Sessions**: Players pay with Crit-Coins to join
3. **Currency Conversion**: When players pay, Crit-Coins convert to Story Credits for GM
4. **Platform Tracks**: All sessions tracked in `critSessions` (financial) and `rpgSessions` (game data)
5. **GMs Get Paid**: After session completion, Story Credits are credited to GM's account

#### GM Payout Options

GMs can redeem earned Story Credits in two ways:

**Option 1: Cash Payout (10% Fee)**
- Convert Story Credits to USD via Stripe Connect
- Platform fee: 10%
- Example: 100 SC earned → $90.00 payout
- Processed via Stripe Connect (connected account required)

**Option 2: Redeem for Crit-Coins (10% Discount)**
- Use Story Credits to purchase Crit-Coin packages at 10% discount
- Get package bonus on top of discount
- Example: 100 SC → $90 purchasing power → Can buy Ultra Pack (60 CC for $50) + Mega Pack (29 CC for $25) + more
- No fees, immediate conversion
- Result: ~90-110 CC depending on package combinations

#### Example GM Rates (Suggested)

These are suggestions only - GMs set their own rates:

| Experience Level | Suggested Rate | Per 4-Hour Session |
|-----------------|---------------|-------------------|
| New GM | 5-10 CC/hour | 20-40 CC |
| Experienced | 10-20 CC/hour | 40-80 CC |
| Professional | 20-50 CC/hour | 80-200 CC |
| Celebrity/Premium | 50+ CC/hour | 200+ CC |

**Important**:
- **Crit-Coins** (purchased currency) cannot be cashed out - they can only be spent on platform features
- **Story Credits** (earned currency) can be cashed out via Stripe Connect or redeemed for Crit-Coins
- This creates a healthy economy: players fund the platform, creators/GMs earn from their work

#### Session Tracking

All paid sessions are tracked in two tables:

- **`critSessions`**: Financial data (duration, players, GMs, rates, payouts)
- **`rpgSessions`**: Game data (logs, notes, events, character actions)


### Legacy Player Package
Legacy Players each receive 12 Crit-Coins per month, in addition to any they may purchase

### Moderator Package
Moderators receive 65 Crit-Coins per month for their services.

### Admin Package
Admins receive 130 Crit-Coins per month for their services.


### Promotional Credits

- **Welcome Bonus**: 1 Crit-Coin (expires in 30 days)
- **Referral Bonus**: 0.5 Crit-Coins per referred user
- **Event Rewards**: Variable amounts for community events

---

## Virtual Desktop System

### What It Is

GPU-powered virtual desktops allow players to:
- Play from mobile devices (phone, tablet)
- Play from low-end PCs/Chromebooks
- Access high-performance gaming hardware on-demand
- No installation or downloads required

### Use Cases

1. **Mobile Players**: Full desktop experience on phone/tablet
2. **Low-End PCs**: Access high-quality graphics without hardware
3. **Testing**: Try the platform before committing to downloads
4. **Travel**: Play from anywhere with internet access

### Pricing (1 Crit-Coin = $1.00)

| Duration | Crit-Coins | Hourly Rate | Savings |
|----------|------------|-------------|---------|
| 30 minutes | 0.5 | 1.0 CC/hour | Base rate |
| 60 minutes | 0.9 | 0.9 CC/hour | 10% off |
| 120 minutes | 1.6 | 0.8 CC/hour | 20% off |

**Real Cost Analysis:**
- DO GPU Droplet: $0.76/hour (~$0.38 for 30 min)
- Network/bandwidth: ~$0.05 for 30 min
- Our margin: ~$0.07 for 30 min
- **Total cost**: ~$0.50 per 30-min session
- **Selling price**: 0.5 Crit-Coins ($0.50 at base rate)

### Technical Specifications

**Hardware:**
- **GPU**: NVIDIA RTX 4080 or better
- **CPU**: 4 vCPUs
- **RAM**: 16GB
- **Storage**: 50GB SSD
- **Network**: 1Gbps connection

**Access Methods:**
- Web browser (HTML5)
- RDP (Remote Desktop Protocol)
- VNC (Virtual Network Computing)

---

## AI Generation Credits

### Pricing (1 Crit-Coin = $1.00)

| AI Credits | Crit-Coins | Per-Credit Cost | Savings |
|-----------|------------|-----------------|---------|
| 10 | 0.2 | 0.02 CC | Base rate |
| 50 | 0.9 | 0.018 CC | 10% off |
| 100 | 1.6 | 0.016 CC | 20% off |

### What You Can Generate

**With AI Credits:**
- Character backstories and personality
- NPC dialogue and motivations
- Quest hooks and plot twists
- Scene descriptions
- Item descriptions and lore
- Encounter recommendations
- Rule clarifications

**Estimated Costs (our actual cost):**
- Simple generation (Haiku): ~$0.001
- Complex generation (Sonnet): ~$0.01
- Creative generation (GPT-4): ~$0.02

**Our Pricing:**
- Average generation: 0.02 Crit-Coins (~$0.02)
- Covers our API costs + small margin

---

## Stripe Integration

### Setup

1. Create Stripe account: https://dashboard.stripe.com/register
2. Get API keys (test and live)
3. Create products in Stripe dashboard
4. Configure webhooks

### Products in Stripe

Each `critProducts` entry has corresponding Stripe products:

```typescript
// Example: Create Stripe products (1 Crit-Coin = $1.00)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

// Crit-Coin packages
await stripe.products.create({
  name: 'Value Pack - 11 Crit-Coins',
  description: '10 Crit-Coins + 1 Bonus (10% extra)',
  metadata: {
    sku: 'CRIT_COINS_11',
    crit_coin_amount: '11'
  }
})

const price = await stripe.prices.create({
  product: '<product-id>',
  unit_amount: 1000, // $10.00 in cents
  currency: 'usd'
})

// Save stripe_product_id and stripe_price_id to critProducts table
```

### Payment Flow

```
1. User clicks "Buy Crit-Coins"
   ↓
2. Frontend creates Stripe Checkout session
   ↓
3. User redirected to Stripe payment page
   ↓
4. User completes payment
   ↓
5. Stripe webhook notifies our server
   ↓
6. Server verifies payment
   ↓
7. Create critCoinTransactions (credit)
   ↓
8. Create critPurchases record
   ↓
9. User sees updated balance
```

### Implementation

```typescript
// Create Stripe Checkout Session
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function createCheckoutSession(
  productId: string,
  playerId: string
) {
  const product = await db.critProducts.findUnique({
    where: { id: productId }
  })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: product.stripe_price_id,
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.NEXTAUTH_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/shop`,
    client_reference_id: playerId,
    metadata: {
      product_id: productId,
      player_id: playerId
    }
  })

  return session.url
}
```

### Webhook Handler

```typescript
// Handle Stripe webhooks
import { buffer } from 'micro'

export async function POST(req: Request) {
  const buf = await buffer(req)
  const sig = req.headers.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_EVENT_SIGNING_SECRET
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object)
      break
    case 'charge.refunded':
      await handleRefund(event.data.object)
      break
  }

  return new Response(JSON.stringify({ received: true }))
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { product_id, player_id } = session.metadata

  const product = await db.critProducts.findUnique({
    where: { id: product_id }
  })

  // Get current balance
  const currentBalance = await getCurrentBalance(player_id)

  // Create transaction (credit)
  const transaction = await db.critCoinTransactions.create({
    data: {
      player_id,
      transaction_type: 'credit',
      amount: product.crit_coin_amount,
      balance_after: currentBalance + product.crit_coin_amount,
      description: `Purchase: ${product.title}`,
      product_id,
      stripe_payment_intent_id: session.payment_intent,
      stripe_charge_id: session.charge
    }
  })

  // Create purchase record
  await db.critPurchases.create({
    data: {
      player_id,
      product_id,
      payment_method: 'stripe',
      amount_usd: product.price_usd,
      stripe_payment_intent_id: session.payment_intent,
      stripe_charge_id: session.charge,
      status: 'completed',
      transaction_id: transaction.id
    }
  })

  // Send confirmation email
  await sendPurchaseConfirmation(player_id, product, transaction)
}
```

---

## Virtual Desktop Provisioning

### Architecture

```
┌─────────────┐
│   User      │
│  (Mobile)   │
└──────┬──────┘
       │
       │ 1. Request VD Session (50 Crit-Coins)
       ↓
┌──────────────────────┐
│   Crit-Fumble App    │
│   (DO Droplet)       │
└──────┬───────────────┘
       │
       │ 2. Debit Crit-Coins
       │ 3. Create VD Session Record
       ↓
┌──────────────────────┐
│  Provision Service   │
│  (Background Job)    │
└──────┬───────────────┘
       │
       │ 4. Create GPU Droplet (doctl)
       ↓
┌──────────────────────┐
│   GPU Droplet        │
│   (RTX 4080)         │
│   - Guacamole        │
│   - Desktop Env      │
│   - Game Client      │
└──────┬───────────────┘
       │
       │ 5. Return Access URL
       ↓
┌─────────────┐
│   User      │
│ (Web Access)│
└─────────────┘
```

### Provisioning Script

```bash
#!/bin/bash
# Provision GPU droplet for virtual desktop

SESSION_ID=$1
PLAYER_ID=$2
DURATION_MINUTES=$3

# Get SSH key
SSH_KEY_ID=$(doctl compute ssh-key list --format ID --no-header | head -n 1)

# Create GPU droplet
DROPLET_NAME="vd-${SESSION_ID}"

doctl compute droplet create $DROPLET_NAME \
  --image ubuntu-22-04-x64-gpu \
  --size g-2vcpu-8gb \
  --region nyc3 \
  --ssh-keys $SSH_KEY_ID \
  --tag-names virtual-desktop,gpu,session-$SESSION_ID \
  --user-data-file /path/to/vd-init.sh \
  --wait

# Get droplet IP
DROPLET_IP=$(doctl compute droplet get $DROPLET_NAME --format PublicIPv4 --no-header)
DROPLET_ID=$(doctl compute droplet get $DROPLET_NAME --format ID --no-header)

# Generate secure password
VD_PASSWORD=$(openssl rand -base64 24)

# Update session record
psql $DATABASE_URL <<SQL
UPDATE critVirtualDesktopSessions
SET
  droplet_id = '$DROPLET_ID',
  droplet_ip = '$DROPLET_IP',
  status = 'provisioning',
  vnc_password_encrypted = pgp_sym_encrypt('$VD_PASSWORD', '$ENCRYPTION_KEY'),
  access_url = 'https://vd.crit-fumble.com/$SESSION_ID'
WHERE id = '$SESSION_ID';
SQL

# Schedule termination
echo "doctl compute droplet delete $DROPLET_ID --force" | at now + $DURATION_MINUTES minutes

# Return success
echo "Droplet provisioned: $DROPLET_IP"
```

### User-Data Script (vd-init.sh)

```bash
#!/bin/bash
# Initialize virtual desktop environment

# Update system
apt update && apt upgrade -y

# Install desktop environment (lightweight)
apt install -y ubuntu-desktop-minimal

# Install Apache Guacamole (HTML5 remote desktop)
apt install -y guacamole guacamole-tomcat libguac-client-rdp0

# Install VNC server
apt install -y tigervnc-standalone-server tigervnc-common

# Install game client dependencies
apt install -y wine64 steam

# Configure firewall
ufw allow 4822/tcp  # Guacamole
ufw allow 3389/tcp  # RDP
ufw allow 5900/tcp  # VNC
ufw enable

# Start services
systemctl enable guacd
systemctl start guacd

echo "Virtual Desktop ready!"
```

### Access via Guacamole

**Apache Guacamole** provides HTML5 web access to the virtual desktop:
- No client installation required
- Works in any modern browser
- Supports touch/mobile devices
- Low latency, good compression

```typescript
// Generate Guacamole connection URL
function generateVDAccessUrl(session: VirtualDesktopSession) {
  const token = generateSecureToken(session.id, session.player_id)

  return `https://vd.crit-fumble.com/guacamole/#/client/${token}?
    type=rdp&
    hostname=${session.droplet_ip}&
    port=3389&
    username=gamer&
    password=${decryptPassword(session.rdp_password_encrypted)}&
    security=any&
    ignore-cert=true&
    resize-method=display-update`
}
```

### Session Management

```typescript
// Background job: Check for expiring sessions
import { CronJob } from 'cron'

const checkExpiringSessions = new CronJob('*/5 * * * *', async () => {
  // Every 5 minutes, check for sessions ending soon

  const expiringSoon = await db.critVirtualDesktopSessions.findMany({
    where: {
      status: 'active',
      scheduled_end_at: {
        lte: new Date(Date.now() + 5 * 60 * 1000) // 5 min warning
      }
    }
  })

  for (const session of expiringSoon) {
    // Send warning to user
    await sendSessionWarning(session.player_id, session.id, 5)
  }

  // Find expired sessions
  const expired = await db.critVirtualDesktopSessions.findMany({
    where: {
      status: 'active',
      scheduled_end_at: {
        lte: new Date()
      }
    }
  })

  for (const session of expired) {
    await terminateSession(session.id)
  }
})

async function terminateSession(sessionId: string) {
  const session = await db.critVirtualDesktopSessions.findUnique({
    where: { id: sessionId }
  })

  if (!session.droplet_id) return

  // Destroy droplet
  await exec(`doctl compute droplet delete ${session.droplet_id} --force`)

  // Update session
  await db.critVirtualDesktopSessions.update({
    where: { id: sessionId },
    data: {
      status: 'terminated',
      ended_at: new Date(),
      actual_duration_minutes: Math.ceil(
        (Date.now() - session.started_at.getTime()) / (1000 * 60)
      )
    }
  })

  // Notify user
  await sendSessionEndedNotification(session.player_id, sessionId)
}
```

---

## BYOK (Bring Your Own Key)

Users can supply their own API keys to avoid Crit-Coin costs.

### Supported Providers

- **Anthropic** (Claude Sonnet, Haiku)
- **OpenAI** (GPT-4)
- **World Anvil** (premium features)

### Security

API keys are encrypted at rest:

```typescript
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET

function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  )

  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

function decryptApiKey(encryptedKey: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedKey.split(':')

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  )

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

### Key Verification

Before accepting a key, verify it works:

```typescript
async function verifyAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const anthropic = new Anthropic({ apiKey })

    await anthropic.messages.create({
      model: 'claude-haiku-3',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Test' }]
    })

    return true
  } catch (error) {
    return false
  }
}
```

---

## Revenue Projections

### Conservative Estimates

**Assumptions:**
- 1,000 active users
- 20% use virtual desktop (200 users)
- Average 2 sessions/month per VD user
- Average 50 Crit-Coins per session

**Virtual Desktop Revenue:**
- 200 users × 2 sessions × 50 coins = 20,000 Crit-Coins/month
- At $0.01/coin = $200/month revenue
- Cost: 400 sessions × $0.38 = $152/month
- **Profit: $48/month**

**Crit-Coin Sales:**
- 30% of users buy coins (300 users)
- Average purchase: $5 (550 coins)
- **Revenue: $1,500/month**

**Total Monthly Revenue (conservative): ~$1,700**

### Growth Scenario

**Assumptions:**
- 10,000 active users
- 30% use virtual desktop
- Average 3 sessions/month
- Average 90 Crit-Coins per session (longer sessions)

**Revenue:**
- VD: 3,000 users × 3 sessions × 90 coins × $0.008/coin = $6,480/month
- Coin sales: 3,000 users × $10 average = $30,000/month
- **Total: ~$36,000/month**

---

## Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_EVENT_SIGNING_SECRET=whsec_...

# Encryption
API_KEY_ENCRYPTION_SECRET=<64-char-hex-key>

# Digital Ocean
DO_API_TOKEN=<your-token>
DO_SPACES_KEY=<your-key>
DO_SPACES_SECRET=<your-secret>
```

---

## Next Steps

1. Set up Stripe account and products
2. Create seed data for critProducts
3. Implement Stripe Checkout integration
4. Build virtual desktop provisioning service
5. Test VD session lifecycle
6. Set up monitoring and alerts
7. Create user documentation

---

Ready to monetize! 💰
