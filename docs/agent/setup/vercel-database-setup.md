# Vercel Postgres Database Setup

## Step 1: Create Database in Vercel Dashboard

1. Go to: https://vercel.com/hobdaytrains-projects/www-crit-fumble-com-2025/stores
2. Click "Create Database" button
3. Select "Postgres"
4. Choose region: `iad1` (US East - Washington, D.C.)
5. Database name: Keep default or use `crit-fumble-db`
6. Click "Create"

Vercel will automatically add these environment variables:
- `POSTGRES_URL` - Direct connection
- `POSTGRES_PRISMA_URL` - **USE THIS** (has connection pooling for serverless)
- `POSTGRES_URL_NON_POOLING` - Direct connection without pooling
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_DATABASE`

## Step 2: Update DATABASE_URL to use Vercel Postgres

After database is created, run:

```bash
# Remove the old DATABASE_URL
npx vercel env rm DATABASE_URL production

# The DATABASE_URL will automatically reference POSTGRES_PRISMA_URL
# Vercel handles this automatically, OR you can manually set it:
# npx vercel env add DATABASE_URL production
# Then paste the value from POSTGRES_PRISMA_URL
```

## Step 3: Run Prisma Migrations

Once the database is created and DATABASE_URL is updated:

```bash
# Pull the latest env vars (including new Postgres vars)
npx vercel env pull .env.vercel.local

# Generate Prisma client
npm run db:generate

# Run migrations against Vercel Postgres
# Option A: Using connection string directly
DATABASE_URL="<your-postgres-prisma-url>" npx prisma migrate deploy

# Option B: Set DATABASE_URL in .env.vercel.local first, then:
npx prisma migrate deploy
```

## Step 4: Verify Database Connection

```bash
# Test the connection
DATABASE_URL="<your-postgres-prisma-url>" npx prisma db execute --stdin <<< "SELECT 1;"

# Or use Prisma Studio
DATABASE_URL="<your-postgres-prisma-url>" npx prisma studio
```

## Important Notes

### Connection Pooling
- **Always use `POSTGRES_PRISMA_URL`** for your application
- This includes `?pgbouncer=true&connection_limit=1` which is critical for serverless
- Never use `POSTGRES_URL` or `POSTGRES_URL_NON_POOLING` in production serverless

### Prisma Schema
- Your [prisma/schema.prisma](prisma/schema.prisma) should have:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```

### Migration Files
- All your existing migrations in [prisma/migrations/](prisma/migrations/) will be applied
- If you need to reset the database: Use Vercel Dashboard → Storage → Reset Database

## Next Steps After Database Setup

1. Deploy the application: `npx vercel --prod`
2. Verify the deployment works
3. Check that auth and database operations work
4. Add custom domain: `new.crit-fumble.com`

## Troubleshooting

### "Too many connections" error
- Verify you're using `POSTGRES_PRISMA_URL` not `POSTGRES_URL`
- Check connection string has `pgbouncer=true&connection_limit=1`

### Migration errors
- Ensure you're connected to the right database
- Check that no other migrations are running
- Verify database user has sufficient permissions

### Can't connect to database
- Verify environment variables are set in Vercel
- Pull latest env vars: `npx vercel env pull`
- Check firewall/network settings (Vercel Postgres should allow all connections)
