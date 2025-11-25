# On-Demand Dev Environment Scripts

Complete self-contained dev environment with database, website, and bridge API on a single droplet.

## Quick Start

```bash
# Start complete dev environment (database + website + bridge)
npm run dev:env:start

# Check status
npm run dev:env:info

# Stop dev environment (destroys droplet, stops billing)
npm run dev:env:stop
```

**Legacy database-only commands still work:**
```bash
npm run dev:db:start  # Alias for dev:env:start
npm run dev:db:stop   # Alias for dev:env:stop
npm run dev:db:info   # Alias for dev:env:info
```

## What You Get

**Remote (on droplet):**
✅ **PostgreSQL Database** (port 5432, Docker)
✅ **Redis Cache** (port 6379, Docker)
✅ **Next.js Website** (port 3000, PM2)
✅ **Bridge API** (port 3001, PM2)

**Local:**
✅ **MCP Server** (port 3333, Docker) - For background test execution

**Features:**
✅ **Automatic code deployment**
✅ **Production data cloning**
✅ **Firewall protection** (your IP only)

## Cost

**Droplet**: $0.024/hour (2GB RAM, 2 vCPUs)
**8-hour session**: ~$0.20
**Typical usage (20 sessions/month)**: ~$5/month

## Workflow

### 1. Start Development Session

```bash
npm run dev:env:start
```

**What it does:**
1. **Remote droplet**: Creates `s-2vcpu-2gb` droplet ($0.024/hour)
2. **Remote droplet**: Installs Docker, Node.js 20, and dependencies
3. **Remote droplet**: Starts PostgreSQL 15 and Redis 7 in Docker
4. **Remote droplet**: Clones your git repository
5. **Remote droplet**: Builds and starts Next.js website (PM2)
6. **Remote droplet**: Builds and starts Bridge API (PM2)
7. **Remote droplet**: Configures firewall (only your IP can access)
8. **Remote droplet**: Clones production database to dev instance
9. **Local machine**: Starts MCP server in Docker
10. Outputs all connection strings

**Total time**: ~3-5 minutes

**Output:**
```
🎉 Dev environment ready!

Remote Services (on droplet):
  Database: postgresql://critfumble:devpassword@165.232.XXX.XXX:5432/critfumble_dev
  Website:  http://165.232.XXX.XXX:3000
  Bridge:   http://165.232.XXX.XXX:3001
  Redis:    redis://:devredispass@165.232.XXX.XXX:6379

Local Services:
  MCP:      http://localhost:3333

Droplet info:
  - ID: 12345678
  - IP: 165.232.XXX.XXX
  - Size: 2GB RAM, 2 vCPUs
  - Cost: $0.024/hour (~$0.20 for 8-hour session)

Commands:
  - SSH:        ssh root@165.232.XXX.XXX
  - Logs:       ssh root@165.232.XXX.XXX 'cd /app/crit-fumble && pm2 logs'
  - Status:     ssh root@165.232.XXX.XXX 'cd /app/crit-fumble && pm2 status'
  - MCP Status: curl http://localhost:3333/health
  - Destroy:    npm run dev:env:stop
```

### 2. Access Services

**Website**: Open `http://{IP}:3000` in browser

**Bridge API**: Test with `curl http://{IP}:3001/health`

**Database**: Connect with `psql postgresql://critfumble:devpassword@{IP}:5432/critfumble_dev`

**Local connection** (optional): Update your `.env.local`:
```bash
DATABASE_URL="postgresql://critfumble:devpassword@{IP}:5432/critfumble_dev"
BRIDGE_API_URL="http://{IP}:3001"
REDIS_URL="redis://:devredispass@{IP}:6379"
```

### 3. Develop and Test

All services are running on the droplet. No need to run anything locally (unless you want to).

**View logs:**
```bash
ssh root@{IP} 'cd /app/crit-fumble && pm2 logs'
```

**Restart services:**
```bash
ssh root@{IP} 'cd /app/crit-fumble && pm2 restart all'
```

### 4. Check Status (Optional)

```bash
npm run dev:env:info
```

Shows current droplet info, all service URLs, and running cost.

### 5. End Development Session

```bash
npm run dev:env:stop
```

**What it does:**
1. Stops local MCP server
2. Destroys dev droplet (database + website + bridge)
3. Stops billing immediately
4. Prompts for confirmation (unless `--force`)

## Features

### Automatic Production Clone

If `.env.production.local` exists with `DATABASE_URL_PUBLIC`, the script will:
1. Export production database schema and data
2. Import to dev database
3. Give you production-like environment for testing

### Firewall Protection

Dev droplet is automatically firewalled to **only your IP**:
- Port 5432 (PostgreSQL): Your IP only
- Port 6379 (Redis): Your IP only
- Port 3000 (Website): Your IP only
- Port 3001 (Bridge): Your IP only
- Port 22 (SSH): Your IP only
- No public access

### Idempotency

Running `npm run dev:env:start` multiple times:
- First run: Creates droplet with all services
- Subsequent runs: Shows existing droplet info (doesn't create duplicate)

### Production Parity

The dev environment matches production:
- ✅ Same OS (Ubuntu 22.04)
- ✅ Same Node.js version (20)
- ✅ Same process manager (PM2)
- ✅ Same Docker containers
- ✅ Same service architecture

## Cost Comparison

### On-Demand Full Environment

| Usage Pattern | Hours/Month | Cost/Month | Annual Cost |
|---------------|-------------|------------|-------------|
| Light (5 sessions × 4h) | 20h | $0.48 | $5.76 |
| Medium (10 sessions × 6h) | 60h | $1.44 | $17.28 |
| Heavy (20 sessions × 8h) | 160h | $3.84 | $46.08 |
| Always On (24/7) | 730h | $17.52 | $210.24 |

### vs. Traditional Development

**Local Development:**
- Cost: $0 (but uses your machine resources)
- Setup: Hours
- Production parity: Low
- Team sharing: Hard

**Always-On Dev Server:**
- Cost: $30-50/month ($360-600/year)
- Idle waste: 100%
- Production parity: High
- Team sharing: Easy

**On-Demand (This Approach):**
- Cost: ~$5/month for typical usage
- Idle waste: 0%
- Production parity: High
- Team sharing: Easy

## Security

### Dev Credentials

**Hardcoded credentials are OKAY for ephemeral dev:**

```
User: critfumble
Password: devpassword
Database: critfumble_dev
```

**Why this is safe:**
- ✅ Temporary droplet (destroyed after session)
- ✅ Firewall restricts to your IP only
- ✅ No production data persists after destruction
- ✅ Not accessible from public internet
- ✅ Only used for local development

### Production Data

Be careful if cloning sensitive production data:
- Consider sanitizing emails, API keys, etc.
- Dev database is destroyed when you run `npm run dev:db:stop`
- Data does not persist between sessions

## Prerequisites

### Install doctl (DigitalOcean CLI)

**Windows:**
```bash
# Run the installer script
./install-doctl.bat
```

**macOS/Linux:**
```bash
# Install via package manager
brew install doctl  # macOS
snap install doctl  # Linux
```

### Authenticate doctl

```bash
doctl auth init
```

Get your API token from: https://cloud.digitalocean.com/account/api/tokens

---

## Troubleshooting

### "No SSH keys found"

```bash
# Add SSH key to DigitalOcean
doctl compute ssh-key create my-key --public-key "$(cat ~/.ssh/id_rsa.pub)"
```

### "doctl is not authenticated"

```bash
doctl auth init
```

### "Connection refused"

Wait 30 seconds after `npm run dev:db:start` for PostgreSQL to fully start.

### "Droplet already exists"

If you want to recreate:
```bash
npm run dev:env:stop
npm run dev:env:start
```

### "Services not starting"

Check logs for errors:
```bash
ssh root@{IP} 'cd /app/crit-fumble && pm2 logs'
```

### "Website shows 500 error"

Rebuild and restart:
```bash
ssh root@{IP}
cd /app/crit-fumble
npm run build
pm2 restart all
```

## Advanced Usage

### Force Destroy (Skip Confirmation)

```bash
bash scripts/dev/destroy-dev-db.sh --force
```

### Manual Access

```bash
# Get droplet IP
npm run dev:env:info

# SSH to droplet
ssh root@{IP}

# Access PostgreSQL container
docker exec -it dev-postgres psql -U critfumble -d critfumble_dev

# View PM2 status
cd /app/crit-fumble && pm2 status

# View all logs
cd /app/crit-fumble && pm2 logs

# Restart services
cd /app/crit-fumble && pm2 restart all
```

### Custom Droplet Size

Edit `scripts/dev/provision-dev-db.sh` and change:

```bash
--size s-2vcpu-2gb    # $0.024/hour (2GB RAM) - Current
--size s-2vcpu-4gb    # $0.036/hour (4GB RAM) - More resources
--size s-1vcpu-1gb    # $0.009/hour (1GB RAM) - Database only (slower)
```

### Update Code on Droplet

```bash
ssh root@{IP}
cd /app/crit-fumble
git pull origin main
npm install
npm run build
pm2 restart all
```

## Upgrade from Database-Only

**Previous version**: Database-only droplet ($0.009/hour)
**Current version**: Complete environment ($0.024/hour)

**What changed:**
- ✅ Added Redis cache
- ✅ Added Next.js website
- ✅ Added Bridge API
- ✅ Added PM2 process management
- ✅ Added automatic code deployment
- ✅ Increased to 2GB RAM (from 1GB)

**Migration**: Automatic - just run `npm run dev:env:start`

See [DEV_ENVIRONMENT_UPGRADE.md](../../docs/agent/deployment/DEV_ENVIRONMENT_UPGRADE.md) for details.

## FAQ

**Q: What if I forget to destroy the droplet?**
A: You'll be billed $0.024/hour. Even if left running 24/7 for a month, it's $17.52 (still reasonable for dev).

**Q: Can multiple developers use this?**
A: Yes! Each developer runs `npm run dev:env:start` and gets their own complete environment.

**Q: Do I need to run services locally?**
A: Only the MCP server runs locally (for background test execution). All other services (database, website, bridge) run on the droplet.

**Q: Can I use this for staging?**
A: Yes, but for staging you probably want a persistent droplet (always-on). This is optimized for temporary dev.

**Q: Is data lost when I destroy?**
A: Yes, that's the point. Always commit schema changes to migrations before destroying.

**Q: How do I access services from my local code?**
A: Update `.env.local` with the droplet IP, then your local code can connect to remote services.

**Q: Can I debug on the droplet?**
A: Yes. SSH in, view PM2 logs, or attach debugger. Or run locally and connect to remote database/bridge.

## Next Steps

1. ✅ Scripts upgraded to full environment
2. Test provisioning: `npm run dev:env:start`
3. Visit website: `http://{IP}:3000`
4. Test bridge API: `curl http://{IP}:3001/health`
5. Verify production data cloning
6. Stop when done: `npm run dev:env:stop`

## Resources

- [Quick Reference](../../docs/agent/deployment/DEV_ENVIRONMENT_QUICK_REF.md)
- [Full Documentation](../../docs/agent/deployment/DEV_ENVIRONMENT.md)
- [Upgrade Guide](../../docs/agent/deployment/DEV_ENVIRONMENT_UPGRADE.md)
- [Legacy Database-Only Guide](../../docs/agent/deployment/ON_DEMAND_DEV_ENVIRONMENT.md)
- [DigitalOcean Droplet Pricing](https://www.digitalocean.com/pricing/droplets)
- [doctl Reference](https://docs.digitalocean.com/reference/doctl/)
