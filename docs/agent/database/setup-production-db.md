# Setting Up Production Database

You have two options for setting up your production database: using the DigitalOcean CLI (`doctl`) or through the web console.

## Option 1: Using DigitalOcean CLI (Recommended)

### Install doctl on Windows

**Using Scoop (Easiest):**
```powershell
# Install Scoop (if not already installed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install doctl
scoop install doctl
```

**Manual Installation:**
1. Download from: https://github.com/digitalocean/doctl/releases/latest
2. Look for `doctl_*_windows_amd64.zip`
3. Extract to a folder (e.g., `C:\Program Files\doctl\`)
4. Add to PATH:
   - Open System Properties → Environment Variables
   - Edit "Path" under System Variables
   - Add: `C:\Program Files\doctl\`
   - Restart your terminal

### Authenticate

```powershell
# Initialize authentication
doctl auth init

# Enter your DigitalOcean API token when prompted
# Get token from: https://cloud.digitalocean.com/account/api/tokens
```

### Create Database

```bash
npm run db:setup:prod
```

This interactive script will:
1. List your existing databases
2. Create a new PostgreSQL 16 database
3. Configure connection pooling
4. Update `.env.production.local`

---

## Option 2: Manual Setup via Web Console

If you prefer not to install `doctl`, you can set up the database through the DigitalOcean web interface.

### Step 1: Create Database

1. Go to https://cloud.digitalocean.com/databases
2. Click **"Create Database Cluster"**
3. Configure:
   - **Database Engine**: PostgreSQL
   - **Version**: 16
   - **Data Center**: Choose closest to your users (e.g., `nyc3`, `sfo3`)
   - **Plan**: Start with `Basic` → `$15/mo` (1 vCPU, 1GB RAM, 10GB Disk, 25 connections)
   - **Cluster Name**: `critfumble-prod`
4. Click **"Create Database Cluster"**
5. Wait 3-5 minutes for provisioning

### Step 2: Get Connection Details

1. Once online, go to the **"Connection Details"** tab
2. Select **"Connection String"** dropdown
3. Copy the connection string (looks like):
   ```
   postgresql://doadmin:PASSWORD@host-do-user-XXXXX.db.ondigitalocean.com:25060/defaultdb?sslmode=require
   ```

### Step 3: Add Connection Pooling Parameters

**IMPORTANT**: Add these parameters to prevent connection exhaustion:

```
?sslmode=require&connection_limit=5&pool_timeout=10&connect_timeout=10
```

**Full example:**
```
postgresql://doadmin:PASSWORD@host.db.ondigitalocean.com:25060/defaultdb?sslmode=require&connection_limit=5&pool_timeout=10&connect_timeout=10
```

### Step 4: Create `.env.production.local`

Create or edit `.env.production.local`:

```bash
# Production Database
DATABASE_URL="postgresql://doadmin:PASSWORD@host.db.ondigitalocean.com:25060/defaultdb?sslmode=require&connection_limit=5&pool_timeout=10&connect_timeout=10"

# Add other production environment variables as needed
# (Copy from .env.production.example)
```

### Step 5: Configure Connection Pooler (Optional but Recommended)

For better connection management:

1. In your database cluster, go to **"Connection Pools"** tab
2. Click **"Create Connection Pool"**
3. Configure:
   - **Pool Name**: `webapp-pool`
   - **Database**: `defaultdb`
   - **Mode**: `Transaction` (recommended) or `Session`
   - **Pool Size**: `25` (or adjust based on your plan)
4. Click **"Create Pool"**
5. Use the **pool connection string** instead of the direct connection string

**Connection Pool URL format:**
```
postgresql://doadmin:PASSWORD@host-do-user-XXXXX.db.ondigitalocean.com:25061/defaultdb?sslmode=require
```

Note: Port is usually `25061` for the pool instead of `25060`.

### Step 6: Test Connection

```bash
# Using psql (if installed)
psql "postgresql://doadmin:PASSWORD@host.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

# Or test with Node
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.$connect().then(() => console.log('✅ Connected!')).catch(e => console.error('❌', e));"
```

---

## Step 7: Run Migrations

Once your production database is configured:

### Initial Setup

```bash
# Generate Prisma Client
npm run db:generate

# Deploy migrations to production
npm run db:migrate:prod
```

This will:
1. Load production DATABASE_URL from `.env.production.local`
2. Apply all existing migrations
3. Create all tables and relationships

### Verify

```bash
# Check if tables were created (using psql)
psql "$DATABASE_URL" -c "\dt"

# Or using Prisma
DATABASE_URL="production-url" npm run db:studio
```

---

## Database Configuration Checklist

- [ ] Database created and online
- [ ] Connection string obtained
- [ ] Connection pooling parameters added to URL
- [ ] `.env.production.local` created with DATABASE_URL
- [ ] Connection tested successfully
- [ ] Prisma migrations deployed
- [ ] Tables verified in database
- [ ] (Optional) Connection pool created
- [ ] Credentials stored securely (password manager, etc.)

---

## Security Best Practices

1. **Never commit** `.env.production.local` to git (already in `.gitignore`)
2. **Use connection pooling** to prevent exhaustion
3. **Enable trusted sources** in DigitalOcean firewall if needed
4. **Rotate passwords** periodically
5. **Use separate databases** for staging and production
6. **Enable automatic backups** in DigitalOcean settings
7. **Monitor connection usage** in DigitalOcean dashboard

---

## Monitoring & Maintenance

### View Metrics

In DigitalOcean console:
- **Metrics** tab shows CPU, memory, disk usage
- **Query Statistics** shows slow queries
- **Connection Count** shows active connections

### Alerts

Set up alerts for:
- High memory usage (>85%)
- High disk usage (>80%)
- High connection count (>80% of limit)

### Backups

- **Daily automated backups** are included
- Retained for 7 days (Basic plan) or longer (higher plans)
- Can trigger manual backups before major changes

---

## Troubleshooting

### Connection Refused

**Problem**: Can't connect to database

**Solutions**:
1. Check if database is online in DO console
2. Verify `sslmode=require` is in connection string
3. Check firewall rules (add your IP if needed)
4. Ensure correct port (`25060` for direct, `25061` for pool)

### Too Many Connections

**Problem**: `remaining connection slots are reserved...`

**Solutions**:
1. Add connection pooling parameters to DATABASE_URL
2. Use connection pool instead of direct connection
3. Ensure all API routes use singleton Prisma client
4. Check for connection leaks: `npm run db:fix-imports`

### Migration Fails

**Problem**: Migration fails with schema errors

**Solutions**:
1. Test migration in dev first: `npm run db:migrate`
2. Check Prisma logs for specific errors
3. Verify schema.prisma is correct
4. Ensure no pending migrations in dev

### Slow Queries

**Problem**: Database performance is slow

**Solutions**:
1. Check Query Statistics in DO console
2. Add indexes to frequently queried columns
3. Optimize N+1 queries with Prisma `include`
4. Consider upgrading database plan
5. Enable query logging in Prisma

---

## Next Steps

After production database is set up:

1. **Deploy Application**: Update production deployment with new DATABASE_URL
2. **Test Thoroughly**: Run integration tests against production
3. **Monitor Performance**: Set up alerts and check metrics regularly
4. **Plan Backups**: Schedule regular backups before major changes
5. **Document Access**: Keep credentials secure and documented

---

## Quick Reference

### Commands

```bash
# Setup (with doctl)
npm run db:setup:prod

# Deploy migrations
npm run db:migrate:prod

# View database
DATABASE_URL="prod-url" npm run db:studio

# Test connection
psql "$DATABASE_URL"

# Clone to dev (for testing)
npm run db:clone:prod-to-dev
```

### Environment Files

- `.env` - Development (local)
- `.env.staging.local` - Staging (not committed)
- `.env.production.local` - Production (not committed)

### Important URLs

- DigitalOcean Console: https://cloud.digitalocean.com/databases
- API Tokens: https://cloud.digitalocean.com/account/api/tokens
- doctl Docs: https://docs.digitalocean.com/reference/doctl/
- Prisma Deploy: https://www.prisma.io/docs/guides/deployment

---

Need help? See [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md) for more detailed information.
