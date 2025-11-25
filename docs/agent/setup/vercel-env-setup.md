# Vercel Environment Variables Setup

## Required Environment Variables for Vercel

### Database & Infrastructure
```bash
DATABASE_URL=<your-vercel-postgres-connection-string>
REDIS_URL=<optional-upstash-redis-or-leave-empty-for-now>
```

### Next.js & Auth
```bash
NODE_ENV=production
NEXTAUTH_URL=<your-vercel-deployment-url>
NEXTAUTH_SECRET=<your-secret>
```

### OAuth Providers
```bash
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>
DISCORD_BOT_TOKEN=<your-discord-bot-token>

GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

WORLD_ANVIL_CLIENT_ID=<your-worldanvil-client-id>
WORLD_ANVIL_CLIENT_SECRET=<your-worldanvil-client-secret>
WORLD_ANVIL_TOKEN=<your-worldanvil-token>
```

### AI Services
```bash
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENAI_API_KEY=<your-openai-key>
```

### Stripe
```bash
STRIPE_SECRET_KEY=<your-stripe-secret>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable>
STRIPE_CONNECT_WEBHOOK_SECRET=<your-webhook-secret>
STRIPE_CONNECT_THIN_WEBHOOK_SECRET=<your-thin-webhook-secret>
STRIPE_CONNECT_CLIENT_ID=<your-connect-client-id>
STRIPE_CRIT_COIN_PRODUCT_ID=<your-product-id>
STRIPE_EVENT_SIGNING_SECRET=<your-event-secret>
STRIPE_THIN_EVENT_SIGNING_SECRET=<your-thin-event-secret>
```

### Encryption
```bash
API_KEY_ENCRYPTION_SECRET=<your-encryption-secret>
```

### Digital Ocean (for Foundry VTT provisioning)
```bash
DO_API_TOKEN=<your-do-token>
DO_SPACES_KEY=<your-spaces-key>
DO_SPACES_SECRET=<your-spaces-secret>
```

### Optional - Development/Testing
```bash
DEV_PHONE=<optional>
DEV_EMAIL=<optional>
DEV_DISCORD=<optional>
IMPERSONATE_PHONE=<optional>
IMPERSONATE_EMAIL=<optional>
IMPERSONATE_DISCORD=<optional>
```

## How to Set Environment Variables

### Option 1: Via Vercel Dashboard
1. Go to https://vercel.com/hobdaytrains-projects/www-crit-fumble-com/settings/environment-variables
2. Add each variable above
3. Select appropriate environments (Production, Preview, Development)

### Option 2: Via Vercel CLI
```bash
# Set individual variables
npx vercel env add DATABASE_URL production
npx vercel env add NEXTAUTH_SECRET production
# ... etc

# Or pull from .env file
npx vercel env pull .env.vercel.local
```

### Option 3: Bulk Import
Create a file with KEY=VALUE pairs and import:
```bash
npx vercel env add < env-vars.txt
```

## Next Steps After Setting Environment Variables

1. Deploy to Vercel: `npx vercel --prod`
2. Update OAuth redirect URLs to point to your Vercel domain
3. Update Stripe webhook endpoints to point to your Vercel domain
4. Test authentication flows
5. Verify database connectivity

## Important Notes

- **DATABASE_URL**: Should include connection pooling parameters for serverless
  Example: `postgresql://user:pass@host:port/db?pgbouncer=true&connection_limit=1`

- **NEXTAUTH_URL**: Will be your Vercel production URL
  Example: `https://www.crit-fumble.com` or `https://crit-fumble.vercel.app`

- **Webhook URLs**: Update in respective services:
  - Discord: Developer Portal
  - GitHub: OAuth App settings
  - Stripe: Webhook endpoints
  - World Anvil: API settings
