# Webhook Configuration Guide
## Stripe Webhooks for Dual-Currency System

This guide covers all webhook URLs needed for the Crit-Fumble dual-currency system (Crit-Coins + Story Credits).

---

## Stripe Webhook Payload Styles

Stripe offers two webhook payload formats. Understanding the difference is important for your webhook implementation.

### Snapshot Payload (Recommended for Our Use Case)

**What it contains**: Full object data embedded in the webhook event.

**Advantages**:
- Contains complete object data - no additional API calls needed
- Easier to work with for most use cases
- Better for our purchase/payout tracking

**Example Structure**:
```json
{
  "id": "evt_abc123xyz",
  "object": "event",
  "api_version": "2019-02-19",
  "created": 1686089970,
  "data": {
    "object": {
      "id": "ch_123",
      "amount": 1000,
      "customer": "cus_123",
      // ... full charge object
    }
  },
  "livemode": false,
  "type": "checkout.session.completed"
}
```

### Thin Payload (V2 Events)

**What it contains**: Minimal event data with references to full objects.

**Advantages**:
- Smaller payload size
- Faster delivery
- Better for high-volume events

**Disadvantages**:
- Requires additional API calls to fetch full object data
- More complex to implement

**Example Structure**:
```json
{
  "id": "evt_abc123xyz",
  "object": "v2.core.event",
  "type": "v1.billing.meter.error_report_triggered",
  "livemode": false,
  "created": "2024-09-17T06:20:52.246Z",
  "related_object": {
    "id": "mtr_test_123456789",
    "type": "billing.meter",
    "url": "/v1/billing/meters/mtr_test_123456789"
  }
}
```

### Our Implementation Choice

**We use Snapshot Payloads** because:
1. Simpler implementation - all data in one payload
2. Lower volume (purchases, not high-frequency events)
3. No additional API calls needed
4. Standard for Checkout and Connect events

**How to configure**: When setting up webhooks in Stripe Dashboard, use **standard events** (not V2 events).

---

## Overview

Our platform uses webhooks to:
1. Process Crit-Coin purchases (Stripe Checkout)
2. Handle Story Credits payouts (Stripe Connect)
3. Manage refunds and disputes
4. Sync customer data

---

## Environment Variables

Add these to your `.env` and `.env` files:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY="sk_test_..."          # Test mode secret key
STRIPE_PUBLISHABLE_KEY="pk_test_..."     # Test mode publishable key

# Stripe Webhook Secrets
STRIPE_EVENT_SIGNING_SECRET="whsec_..."         # Main webhook for purchases
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_..."  # Connect webhook for payouts

# Stripe Connect (for Story Credits payouts)
STRIPE_CONNECT_CLIENT_ID="ca_..."         # OAuth client ID for Connect

# Product IDs
STRIPE_CRIT_COIN_PRODUCT_ID="prod_..."    # Main product ID for Crit-Coins
```

---

## Webhook Endpoints

You need to create **TWO separate webhook endpoints** in Stripe:

### 1. Main Webhook (Purchases)
**URL**: `https://yourdomain.com/api/webhooks/stripe`

**Purpose**: Handle Crit-Coin purchases from players

**Events to Subscribe**:
- `checkout.session.completed` - Payment succeeded
- `payment_intent.succeeded` - Backup payment confirmation
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed
- `charge.dispute.created` - Chargeback initiated
- `customer.created` - New customer created
- `customer.updated` - Customer details changed
- `customer.deleted` - Customer deleted

**Local Development**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret to .env
```

---

### 2. Connect Webhook (Payouts)
**URL**: `https://yourdomain.com/api/webhooks/stripe/connect`

**Purpose**: Handle Story Credits payouts to GMs and creators

**Events to Subscribe**:
- `account.updated` - Connected account updated
- `transfer.created` - Payout initiated
- `transfer.updated` - Payout status changed
- `transfer.failed` - Payout failed
- `payout.created` - Payout to bank initiated
- `payout.paid` - Payout completed
- `payout.failed` - Payout to bank failed

**Local Development**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe/connect \
  --events account.updated,transfer.created,transfer.updated,transfer.failed,payout.created,payout.paid,payout.failed
# Copy the webhook signing secret to STRIPE_CONNECT_WEBHOOK_SECRET
```

---

## Webhook Handlers

### Main Webhook Handler

Create: `src/app/api/webhooks/stripe/route.ts`

```typescript
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_EVENT_SIGNING_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object.id)
      break

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
      break

    case 'charge.refunded':
      await handleRefund(event.data.object as Stripe.Charge)
      break

    case 'charge.dispute.created':
      await handleDispute(event.data.object as Stripe.Dispute)
      break

    case 'customer.created':
      console.log('Customer created:', event.data.object.id)
      break

    case 'customer.updated':
      await handleCustomerUpdated(event.data.object as Stripe.Customer)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const playerId = session.metadata?.playerId
  const productId = session.metadata?.productId

  if (!playerId || !productId) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Get product details
  const product = await prisma.critProduct.findUnique({
    where: { id: productId }
  })

  if (!product || !product.critCoinAmount) {
    console.error('Product not found or invalid')
    return
  }

  // Get current balance
  const currentBalance = await getCurrentCritCoinBalance(playerId)

  // Create transaction (credit Crit-Coins)
  await prisma.critCoinTransaction.create({
    data: {
      playerId,
      productId,
      transactionType: 'credit',
      amount: product.critCoinAmount,
      balanceAfter: currentBalance + product.critCoinAmount,
      description: `Purchased ${product.name}`,
      stripePaymentIntentId: session.payment_intent as string,
      metadata: {
        sessionId: session.id,
        amountPaid: session.amount_total,
        currency: session.currency
      }
    }
  })

  // Create purchase record
  await prisma.critPurchase.create({
    data: {
      playerId,
      productId,
      paymentMethod: 'stripe',
      amountUsd: product.priceUsd!,
      stripePaymentIntentId: session.payment_intent as string,
      status: 'completed'
    }
  })

  console.log(`Credited ${product.critCoinAmount} CC to player ${playerId}`)
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error)
  // TODO: Notify player of failed payment
}

async function handleRefund(charge: Stripe.Charge) {
  // Find the original transaction
  const transaction = await prisma.critCoinTransaction.findFirst({
    where: {
      stripeChargeId: charge.id,
      transactionType: 'credit'
    },
    include: {
      product: true
    }
  })

  if (!transaction) {
    console.error('Original transaction not found for refund')
    return
  }

  // Get current balance
  const currentBalance = await getCurrentCritCoinBalance(transaction.playerId)

  // Create refund transaction (debit)
  await prisma.critCoinTransaction.create({
    data: {
      playerId: transaction.playerId,
      productId: transaction.productId,
      transactionType: 'debit',
      amount: transaction.amount,
      balanceAfter: currentBalance - transaction.amount,
      description: `Refund: ${transaction.product?.name || 'Unknown product'}`,
      stripeChargeId: charge.id,
      metadata: {
        refundId: charge.refunds?.data[0]?.id,
        originalTransactionId: transaction.id
      }
    }
  })

  // Update purchase record
  await prisma.critPurchase.updateMany({
    where: {
      stripePaymentIntentId: charge.payment_intent as string
    },
    data: {
      status: 'refunded'
    }
  })

  console.log(`Refunded ${transaction.amount} CC from player ${transaction.playerId}`)
}

async function handleDispute(dispute: Stripe.Dispute) {
  console.error('Dispute created:', dispute.id, dispute.reason)
  // TODO: Alert admin, investigate dispute
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  // Sync customer data with Player record
  const playerId = customer.metadata?.playerId

  if (playerId) {
    await prisma.player.update({
      where: { id: playerId },
      data: {
        email: customer.email || undefined
      }
    })
  }
}

async function getCurrentCritCoinBalance(playerId: string): Promise<number> {
  const transactions = await prisma.critCoinTransaction.findMany({
    where: { playerId },
    select: {
      transactionType: true,
      amount: true
    }
  })

  return transactions.reduce((balance, tx) => {
    return tx.transactionType === 'credit'
      ? balance + tx.amount
      : balance - tx.amount
  }, 0)
}
```

---

### Connect Webhook Handler (Story Credits Payouts)

Create: `src/app/api/webhooks/stripe/connect/route.ts`

```typescript
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Connect webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'account.updated':
      await handleAccountUpdated(event.data.object as Stripe.Account)
      break

    case 'transfer.created':
      await handleTransferCreated(event.data.object as Stripe.Transfer)
      break

    case 'transfer.updated':
      await handleTransferUpdated(event.data.object as Stripe.Transfer)
      break

    case 'transfer.failed':
      await handleTransferFailed(event.data.object as Stripe.Transfer)
      break

    case 'payout.created':
      console.log('Payout initiated:', event.data.object.id)
      break

    case 'payout.paid':
      await handlePayoutPaid(event.data.object as Stripe.Payout)
      break

    case 'payout.failed':
      await handlePayoutFailed(event.data.object as Stripe.Payout)
      break

    default:
      console.log(`Unhandled Connect event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handleAccountUpdated(account: Stripe.Account) {
  const playerId = account.metadata?.playerId

  if (playerId) {
    // Update player's connected account status
    await prisma.player.update({
      where: { id: playerId },
      data: {
        metadata: {
          stripeConnectedAccountId: account.id,
          stripeAccountComplete: account.charges_enabled && account.payouts_enabled
        }
      }
    })

    console.log(`Updated connected account for player ${playerId}`)
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  const transactionId = transfer.metadata?.storyCreditTransactionId

  if (transactionId) {
    // Update Story Credit transaction with transfer ID
    await prisma.storyCreditTransaction.update({
      where: { id: transactionId },
      data: {
        stripeTransferId: transfer.id,
        payoutStatus: 'processing'
      }
    })

    console.log(`Transfer created for Story Credit transaction ${transactionId}`)
  }
}

async function handleTransferUpdated(transfer: Stripe.Transfer) {
  // Update transaction if needed
  const transaction = await prisma.storyCreditTransaction.findFirst({
    where: { stripeTransferId: transfer.id }
  })

  if (transaction) {
    console.log(`Transfer updated: ${transfer.id}`)
  }
}

async function handleTransferFailed(transfer: Stripe.Transfer) {
  const transaction = await prisma.storyCreditTransaction.findFirst({
    where: { stripeTransferId: transfer.id }
  })

  if (transaction) {
    // Mark payout as failed
    await prisma.storyCreditTransaction.update({
      where: { id: transaction.id },
      data: {
        payoutStatus: 'failed',
        metadata: {
          ...transaction.metadata as object,
          failureReason: transfer.failure_message || 'Unknown error'
        }
      }
    })

    // Reverse the Story Credit debit (give credits back)
    const currentBalance = await getCurrentStoryCreditBalance(transaction.playerId)

    await prisma.storyCreditTransaction.create({
      data: {
        playerId: transaction.playerId,
        transactionType: 'earned',
        amount: transaction.amount,
        balanceAfter: currentBalance + transaction.amount,
        description: 'Payout failed - credits returned',
        source: 'payout_reversal',
        metadata: {
          originalTransactionId: transaction.id,
          reversalReason: transfer.failure_message || 'Transfer failed'
        }
      }
    })

    console.error(`Transfer failed: ${transfer.id} - credits returned to player`)
  }
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  console.log('Payout completed:', payout.id)
  // Payout is final - funds sent to bank account
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  console.error('Payout failed:', payout.id, payout.failure_message)
  // TODO: Alert admin about failed payout
}

async function getCurrentStoryCreditBalance(playerId: string): Promise<number> {
  const transactions = await prisma.storyCreditTransaction.findMany({
    where: { playerId },
    select: {
      transactionType: true,
      amount: true
    }
  })

  return transactions.reduce((balance, tx) => {
    return tx.transactionType === 'earned'
      ? balance + Number(tx.amount)
      : balance - Number(tx.amount)
  }, 0)
}
```

---

## Setting Up Webhooks in Stripe Dashboard

### Test Mode Setup

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"

#### Main Webhook (Purchases)
- **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
- **Events**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `charge.dispute.created`
  - `customer.created`
  - `customer.updated`
  - `customer.deleted`
- Click "Add endpoint"
- Copy the **Signing secret** (starts with `whsec_...`)
- Add to `.env`: `STRIPE_EVENT_SIGNING_SECRET="whsec_..."`

#### Connect Webhook (Payouts)
- **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe/connect`
- **Events**:
  - `account.updated`
  - `transfer.created`
  - `transfer.updated`
  - `transfer.failed`
  - `payout.created`
  - `payout.paid`
  - `payout.failed`
- Click "Add endpoint"
- Copy the **Signing secret**
- Add to `.env`: `STRIPE_CONNECT_WEBHOOK_SECRET="whsec_..."`

---

## Local Development with Stripe CLI

### Install Stripe CLI

**Windows**:
```powershell
scoop install stripe
```

**Mac/Linux**:
```bash
brew install stripe/stripe-cli/stripe
```

### Login
```bash
stripe login
```

### Forward Webhooks to Local Server

Terminal 1 (Main webhook):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret shown
# Add to .env: STRIPE_EVENT_SIGNING_SECRET="whsec_..."
```

Terminal 2 (Connect webhook):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe/connect \
  --events account.updated,transfer.created,transfer.updated,transfer.failed,payout.created,payout.paid,payout.failed
# Copy the webhook signing secret shown
# Add to .env: STRIPE_CONNECT_WEBHOOK_SECRET="whsec_..."
```

Terminal 3 (Development server):
```bash
npm run dev
```

---

## Testing Webhooks

### Test Crit-Coin Purchase
```bash
# Trigger a test checkout.session.completed event
stripe trigger checkout.session.completed
```

### Test Story Credits Payout
```bash
# Trigger a test transfer.created event
stripe trigger transfer.created
```

### Test Refund
```bash
# Trigger a test charge.refunded event
stripe trigger charge.refunded
```

---

## Production Checklist

Before going live:

- [ ] Switch to **Live mode** in Stripe Dashboard
- [ ] Get Live API keys: https://dashboard.stripe.com/apikeys
- [ ] Create Live webhook endpoints with HTTPS URLs
- [ ] Update `.env.production` with live keys and secrets
- [ ] Set up Stripe Connect for GM/creator payouts
- [ ] Test with real (small) transactions
- [ ] Configure Stripe Radar for fraud prevention
- [ ] Set up email notifications for failed webhooks
- [ ] Monitor webhook delivery in Stripe Dashboard

---

## Troubleshooting

### Webhook Not Receiving Events
1. Check Stripe CLI is running (`stripe listen`)
2. Verify webhook URL is correct
3. Check server logs for errors
4. Verify signature secret matches

### Signature Verification Failed
1. Ensure using correct webhook secret (test vs live)
2. Don't modify request body before verification
3. Use raw body (not parsed JSON)

### Missing Metadata
1. Verify metadata is set when creating Checkout Session
2. Check metadata in Stripe Dashboard under event details

---

## Summary

You now have:
- ✅ Main webhook for Crit-Coin purchases
- ✅ Connect webhook for Story Credits payouts
- ✅ Event handlers for all critical events
- ✅ Local testing setup with Stripe CLI
- ✅ Production deployment checklist

Next: Implement the frontend shop UI and Stripe Connect onboarding flow!
