# Docker Configuration

**Location:** `docker/` directory (docker-compose.*.yml, Dockerfile.*)

**Purpose:** Docker configurations for deploying FoundryVTT instances on DigitalOcean droplets.

**Last Updated:** 2025-11-24

---

## 🏗️ Current Infrastructure

### Hosted on Vercel (NOT Docker):
- **Web Application** - Next.js app deployed to Vercel
- **Database** - Vercel Postgres
- **Blob Storage** - Vercel Blob Storage
- **Serverless Functions** - All API routes

### Hosted on DigitalOcean (Docker):
- **FoundryVTT Instances** - Deployed as Docker containers on droplets

---

## 📁 Available Files

### Production Use

**[docker-compose.foundry.yml](docker-compose.foundry.yml)**
- Deploys FoundryVTT on a DigitalOcean droplet
- Minimal configuration for VTT-only hosting
- Connects to Vercel-hosted database and APIs
- **Use this for production Foundry deployments**

**[Dockerfile.foundry](Dockerfile.foundry)**
- Docker image for FoundryVTT
- Based on official Foundry container
- Includes custom module support

### Testing & Development

**[docker-compose.test.yml](docker-compose.test.yml)**
- Test capture service with Playwright
- VNC debugging support
- MCP server for background test execution
- **Use for running E2E tests in isolated environment**

**[Dockerfile.playwright](Dockerfile.playwright)**
- Playwright test runner image
- Includes browsers and test dependencies

---

## 🚀 Quick Start

### Deploy FoundryVTT Instance

1. **On your DigitalOcean droplet:**

```bash
# Clone repository
git clone <your-repo-url>
cd www.crit-fumble.com/docker

# Create .env file with Foundry credentials (in project root)
cat > ../.env << EOF
FOUNDRY_USERNAME=your_username
FOUNDRY_PASSWORD=your_password
FOUNDRY_ADMIN_KEY=your_admin_key
FOUNDRY_LICENSE_KEY=your_license_key
FOUNDRY_PORT=30000
DATABASE_URL=your_vercel_postgres_url
EOF

# Start Foundry
docker-compose -f docker-compose.foundry.yml up -d

# Check status
docker-compose -f docker-compose.foundry.yml ps

# View logs
docker-compose -f docker-compose.foundry.yml logs -f foundry
```

2. **Access Foundry:**
   - Visit `http://your-droplet-ip:30000`
   - Configure SSL/domain as needed

3. **Stop Foundry:**
```bash
docker-compose -f docker-compose.foundry.yml down
```

### Run Tests with Docker

```bash
# From docker/ directory
cd docker

# Run test capture service
docker-compose -f docker-compose.test.yml run test-capture

# Run specific test
docker-compose -f docker-compose.test.yml run test-capture npm run test:e2e auth.spec.ts

# With VNC debugging
docker-compose -f docker-compose.test.yml --profile debug up
# Access VNC viewer at http://localhost:6080
```

---

## 📋 Environment Variables

### Required for Foundry

```bash
FOUNDRY_USERNAME=       # Your Foundry account username
FOUNDRY_PASSWORD=       # Your Foundry account password
FOUNDRY_ADMIN_KEY=      # Admin password for Foundry instance
FOUNDRY_LICENSE_KEY=    # Your Foundry license key
```

### Optional Configuration

```bash
FOUNDRY_PORT=30000              # Port to expose Foundry (default: 30000)
FOUNDRY_PROXY_SSL=false         # Set to true if behind SSL proxy
FOUNDRY_PROXY_PORT=443          # Port for SSL proxy
FOUNDRY_AWS_CONFIG=             # AWS/S3 configuration for assets
```

---

## 🔧 Maintenance

### Update Foundry Container

```bash
# From docker/ directory
cd docker

# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.foundry.yml up -d --build
```

### Backup Foundry Data

```bash
# From docker/ directory
cd docker

# Foundry data is in the foundry_data volume
docker run --rm -v foundry_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/foundry-backup-$(date +%Y%m%d).tar.gz /data
```

### Restore Foundry Data

```bash
# From docker/ directory
cd docker

# Extract backup
docker run --rm -v foundry_data:/data -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/foundry-backup-YYYYMMDD.tar.gz --strip 1"
```

### View Resource Usage

```bash
docker stats foundry-vtt
```

---

## 🗑️ Removed Files

The following files were removed as they're no longer relevant with Vercel hosting:

- ~~`docker-compose.yml`~~ - Full stack (web, DB, Redis, Foundry, etc.)
- ~~`docker-compose.dev.yml`~~ - Development overlay for full stack
- ~~`docker-compose.prod.yml`~~ - Production overlay for full stack
- ~~`docker-compose.small-scale.yml`~~ - 36-user production setup
- ~~`Dockerfile`~~ - Next.js web app (now on Vercel)
- ~~`Dockerfile.bot`~~ - Discord bot (not implemented)

These were for the old architecture where everything ran in Docker on DigitalOcean.

---

## 📝 Architecture Notes

### Why Split Hosting?

- **Vercel:**
  - Optimized for Next.js deployment
  - Serverless scaling
  - Integrated database and storage
  - Free tier suitable for development
  - Global CDN

- **DigitalOcean Droplets:**
  - FoundryVTT requires persistent WebSocket connections
  - Needs long-running processes
  - Resource-intensive during game sessions
  - Better cost control for VTT workloads

---

## 🔗 Related Documentation

- [FoundryVTT Integration Guide](/docs/agent/integrations/foundry-integration-summary.md)
- [Deployment Setup](/docs/agent/setup/)
- [Testing Guide](/docs/agent/testing/how-to-run.md)

---

## 📄 License

Proprietary - All Rights Reserved
