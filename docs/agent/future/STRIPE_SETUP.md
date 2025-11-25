# Stripe Setup Guide
## Crit-Fumble Platform - Payment Processing

This guide will walk you through setting up Stripe for accepting payments for Crit-Coins.

---

## Goals

1. **Link Players to Stripe Customers**: One Stripe customer per player
2. **Accept Payments**: Process credit card payments for Crit-Coin packages
3. **Track Purchases**: Record all transactions in our database
4. **Handle Webhooks**: Process payment events from Stripe

---

## Step 1: Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Create an account (if you don't have one)
3. Complete business verification (optional for test mode)

---

## Step 2: Get API Keys

### Test Mode Keys (for development)

1. Navigate to: https://dashboard.stripe.com/test/apikeys
2. Copy your keys:
   - **Publishable key**: `pk_test_...` (safe to expose in frontend)
   - **Secret key**: `sk_test_...` (NEVER expose - backend only)

### Add to .env

```bash
# In www.crit-fumble.com/.env
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
```

---

## Step 3: Create Crit-Coin Products in Stripe

We need to create products for each Crit-Coin package:

### Via Stripe Dashboard:

1. Go to: https://dashboard.stripe.com/test/products
2. Click "Add product" for each package:

**Base Value**: 1 Crit-Coin = $1.00 USD

#### Starter Pack
- **Name**: 1 Crit-Coin
- **Description**: Try out virtual desktops and AI features
- **Price**: $1.00 USD
- **Recurring**: No (one-time payment)
- Click "Save product"
- Copy the **Product ID** (starts with `prod_...`)
- Copy the **Price ID** (starts with `price_...`)

#### Value Pack (10% Bonus)
- **Name**: 11 Crit-Coins
- **Description**: Get 10% bonus - 10 coins + 1 free!
- **Price**: $10.00 USD
- **Recurring**: No
- Note: 10 purchased + 1 bonus = 11 total

#### Mega Pack (16% Bonus)
- **Name**: 29 Crit-Coins
- **Description**: Get 16% bonus - 25 coins + 4 free!
- **Price**: $25.00 USD
- **Recurring**: No

#### Ultra Pack (20% Bonus) - Best Value
- **Name**: 60 Crit-Coins
- **Description**: Maximum value! 20% bonus - 50 coins + 10 free!
- **Price**: $50.00 USD
- **Recurring**: No

### Update Database

After creating products in Stripe, you'll need to add them to your database:

```sql
-- Run via Prisma Studio or psql
-- Note: 1 Crit-Coin = $1.00 USD

INSERT INTO crit_products (id, sku, name, title, product_type, price_usd, crit_coin_amount, stripe_product_id, stripe_price_id, is_active, is_featured, display_order)
VALUES
  (gen_random_uuid(), 'CRIT_COINS_1', '1 Crit-Coin', 'Starter Pack', 'crit_coins', 1.00, 1, 'prod_YOUR_PRODUCT_ID', 'price_YOUR_PRICE_ID', true, false, 1),
  (gen_random_uuid(), 'CRIT_COINS_11', '11 Crit-Coins', 'Value Pack', 'crit_coins', 10.00, 11, 'prod_YOUR_PRODUCT_ID', 'price_YOUR_PRICE_ID', true, true, 2),
  (gen_random_uuid(), 'CRIT_COINS_29', '29 Crit-Coins', 'Mega Pack', 'crit_coins', 25.00, 29, 'prod_YOUR_PRODUCT_ID', 'price_YOUR_PRICE_ID', true, false, 3),
  (gen_random_uuid(), 'CRIT_COINS_60', '60 Crit-Coins', 'Ultra Pack', 'crit_coins', 50.00, 60, 'prod_YOUR_PRODUCT_ID', 'price_YOUR_PRICE_ID', true, false, 4);
```

---

## Step 4: Set Up Webhook Endpoint

### Why Webhooks?

Webhooks let Stripe notify your app when payments succeed, fail, or are refunded.

### Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
   - For local dev, use Stripe CLI (see below)
4. **Events to send**:
   - `checkout.session.completed` - Payment succeeded
   - `payment_intent.succeeded` - Alternative payment confirmation
   - `payment_intent.payment_failed` - Payment failed
   - `charge.refunded` - Refund processed
   - `customer.created` - New customer created
   - `customer.updated` - Customer details changed
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_...`)

### Add Webhook Secret to .env

```bash
STRIPE_EVENT_SIGNING_SECRET="whsec_YOUR_SIGNING_SECRET_HERE"
```

---

## Step 5: Stripe CLI (for Local Development)

The Stripe CLI lets you test webhooks locally.

### Install Stripe CLI

#### Windows:
```powershell
# Using Scoop
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

#### Mac/Linux:
```bash
brew install stripe/stripe-cli/stripe
```

### Login to Stripe

```bash
stripe login
# Follow the prompts to authenticate
```

### Forward Webhooks to Local Server

```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will output a webhook signing secret for local dev
# Add it to your .env:
# STRIPE_EVENT_SIGNING_SECRET="whsec_local_..."
```

---

## Step 6: Required Webhook Events

Here are the events we need to handle:

### Critical Events (Must Handle)

1. **`checkout.session.completed`**
   - When: User completes payment
   - Action:
     - Create Stripe customer if first purchase
     - Credit player's Crit-Coin balance
     - Create `CritCoinTransaction` record
     - Create `CritPurchase` record

2. **`payment_intent.succeeded`**
   - When: Payment successfully processed
   - Action: Backup confirmation of payment

3. **`payment_intent.payment_failed`**
   - When: Payment failed (insufficient funds, etc.)
   - Action: Log failure, notify player

### Important Events (Should Handle)

4. **`charge.refunded`**
   - When: Payment refunded by admin
   - Action:
     - Debit player's Crit-Coin balance
     - Create negative `CritCoinTransaction`
     - Update `CritPurchase` status to 'refunded'

5. **`customer.created`**
   - When: New Stripe customer created
   - Action: Link to Player record

6. **`customer.updated`**
   - When: Customer details change
   - Action: Sync with Player record

### Optional Events (Nice to Have)

7. **`invoice.payment_succeeded`** - For subscription billing (future)
8. **`customer.subscription.created`** - If we add subscriptions
9. **`charge.dispute.created`** - Chargeback notification

---

## Step 7: Customer Creation Flow

When a player makes their first purchase:

### Option 1: Create Customer During Checkout

```typescript
// src/app/api/stripe/checkout/route.ts
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await req.json();

  // Get player from database
  const player = await prisma.player.findUnique({
    where: { id: session.user.id }
  });

  if (!player) {
    return Response.json({ error: 'Player not found' }, { status: 404 });
  }

  // Get product from database
  const product = await prisma.critProduct.findUnique({
    where: { id: productId }
  });

  if (!product || !product.stripePriceId) {
    return Response.json({ error: 'Invalid product' }, { status: 400 });
  }

  // Create or get Stripe customer
  let stripeCustomerId = player.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: player.email || undefined,
      metadata: {
        playerId: player.id,
        discordId: player.discordId,
        username: player.username
      }
    });

    stripeCustomerId = customer.id;

    // Update player with Stripe customer ID
    await prisma.player.update({
      where: { id: player.id },
      data: { stripeCustomerId: customer.id }
    });
  }

  // Create Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price: product.stripePriceId,
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${process.env.NEXTAUTH_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/shop/cancel`,
    metadata: {
      playerId: player.id,
      productId: product.id
    }
  });

  return Response.json({ url: checkoutSession.url });
}
```

---

## Step 8: Webhook Handler Implementation

```typescript
// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_EVENT_SIGNING_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case 'charge.refunded':
      await handleRefund(event.data.object as Stripe.Charge);
      break;

    case 'customer.created':
      console.log('Customer created:', event.data.object.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const playerId = session.metadata?.playerId;
  const productId = session.metadata?.productId;

  if (!playerId || !productId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Get product details
  const product = await prisma.critProduct.findUnique({
    where: { id: productId }
  });

  if (!product || !product.critCoinAmount) {
    console.error('Product not found or invalid');
    return;
  }

  // Get current balance
  const currentBalance = await getCurrentBalance(playerId);

  // Create transaction (credit)
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
  });

  // Create purchase record
  await prisma.critPurchase.create({
    data: {
      playerId,
      productId,
      paymentMethod: 'stripe',
      amountUsd: product.priceUsd,
      stripePaymentIntentId: session.payment_intent as string,
      status: 'completed'
    }
  });

  console.log(`Credited ${product.critCoinAmount} coins to player ${playerId}`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  // Additional logging or confirmation
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error);
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
  });

  if (!transaction) {
    console.error('Original transaction not found for refund');
    return;
  }

  // Get current balance
  const currentBalance = await getCurrentBalance(transaction.playerId);

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
  });

  // Update purchase record
  await prisma.critPurchase.updateMany({
    where: {
      stripePaymentIntentId: charge.payment_intent as string
    },
    data: {
      status: 'refunded'
    }
  });

  console.log(`Refunded ${transaction.amount} coins from player ${transaction.playerId}`);
}

async function getCurrentBalance(playerId: string): Promise<number> {
  const result = await prisma.critCoinTransaction.aggregate({
    where: { playerId },
    _sum: {
      amount: true
    }
  });

  // Calculate balance (credits - debits)
  const transactions = await prisma.critCoinTransaction.findMany({
    where: { playerId },
    select: {
      transactionType: true,
      amount: true
    }
  });

  return transactions.reduce((balance, tx) => {
    return tx.transactionType === 'credit'
      ? balance + tx.amount
      : balance - tx.amount;
  }, 0);
}
```

---

## Step 9: Testing the Integration

### Test with Stripe Test Cards

Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

### Test Workflow

1. **Start local dev server**: `npm run dev`
2. **Start Stripe webhook forwarding**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. **Make a test purchase**:
   - Go to shop page
   - Select a Crit-Coin package
   - Use test card `4242 4242 4242 4242`
   - Complete checkout
4. **Verify webhook received**:
   - Check Stripe CLI output
   - Check server logs
   - Check database for new transaction

### Check Database

```sql
-- View recent transactions
SELECT * FROM crit_coin_transactions ORDER BY created_at DESC LIMIT 10;

-- View purchases
SELECT * FROM crit_purchases ORDER BY created_at DESC LIMIT 10;

-- Check player balance
SELECT
  player_id,
  SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END) as balance
FROM crit_coin_transactions
GROUP BY player_id;
```

---

## Step 10: Production Checklist

Before going live:

- [ ] Switch to **Live mode** keys in Stripe Dashboard
- [ ] Get Live API keys from: https://dashboard.stripe.com/apikeys
- [ ] Create products in Live mode (not Test mode)
- [ ] Set up Live webhook endpoint with HTTPS URL
- [ ] Update `.env.production` with live keys
- [ ] Test with real (small) transaction
- [ ] Set up Stripe Radar for fraud prevention
- [ ] Configure email receipts in Stripe Dashboard
- [ ] Set up payout schedule (daily/weekly/monthly)

---

## Security Best Practices

1. **Never expose Secret Key**: Keep `STRIPE_SECRET_KEY` server-side only
2. **Verify webhook signatures**: Always validate with `stripe.webhooks.constructEvent`
3. **Use HTTPS**: Stripe requires HTTPS for webhooks
4. **Validate amounts**: Don't trust client-side pricing
5. **Handle idempotency**: Webhooks may be sent multiple times
6. **Log everything**: Keep audit trail of all transactions

---

## Summary

You now have:
- ✅ Stripe account with API keys
- ✅ Products created for Crit-Coin packages
- ✅ Webhook endpoint configured
- ✅ Customer creation flow
- ✅ Payment processing logic
- ✅ Refund handling
- ✅ Local testing setup with Stripe CLI

Next: Implement the frontend shop UI to display products and initiate checkout!
