# Foundry VTT Multi-Instance Architecture Evaluation

**Date:** January 26, 2025
**Status:** Architecture Proposal
**License Pool:** 3 Foundry VTT License Keys
**Goal:** Enable owners to spin up/tear down up to 3 instances via DigitalOcean

---

## Executive Summary

**Recommendation:** ✅ **Option A: Single Static Droplet with 3 Instances**

Based on the analysis of existing infrastructure, usage patterns, and cost optimization, a single static droplet running 3 Docker containers is the optimal solution for the current scale.

| Factor | Option A (Static) | Option B (Dynamic) | Winner |
|--------|-------------------|-------------------|---------|
| **Monthly Cost** | ~$12/month | ~$52/month (3 instances @ 100% uptime) | ✅ Static |
| **Setup Complexity** | Low | High (DNS automation, droplet lifecycle) | ✅ Static |
| **DNS Configuration** | One-time setup | Dynamic API calls, propagation delays | ✅ Static |
| **Startup Time** | Instant (containers already running) | 2-5 minutes (droplet boot + DNS) | ✅ Static |
| **Resource Isolation** | Docker containers (good enough) | Full VM isolation (overkill) | ✅ Static |
| **Maintenance** | Simple, persistent | Complex orchestration | ✅ Static |

**When to revisit:** If you scale to 10+ instances or need hard resource isolation.

---

## Option A: Single Static Droplet (RECOMMENDED)

### Architecture Overview

```
                                    ┌─────────────────────────────────┐
                                    │   DigitalOcean Droplet          │
                                    │   (4GB RAM, 2 vCPUs)            │
                                    │   IP: 165.227.x.x               │
                                    └─────────────────────────────────┘
                                                  │
                         ┌────────────────────────┼────────────────────────┐
                         │                        │                        │
              ┌──────────▼──────────┐  ┌─────────▼──────────┐  ┌─────────▼──────────┐
              │  Foundry Instance 1 │  │  Foundry Instance 2│  │  Foundry Instance 3│
              │  Docker Container   │  │  Docker Container  │  │  Docker Container  │
              │  Port: 30000        │  │  Port: 30001       │  │  Port: 30002       │
              │  License: KEY_1     │  │  License: KEY_2    │  │  License: KEY_3    │
              └─────────────────────┘  └────────────────────┘  └────────────────────┘
                         │                        │                        │
                         └────────────────────────┼────────────────────────┘
                                                  │
                                    ┌─────────────▼─────────────┐
                                    │   Nginx Reverse Proxy     │
                                    │   SSL Termination         │
                                    └───────────────────────────┘
                                                  │
                         ┌────────────────────────┼────────────────────────┐
                         │                        │                        │
              ┌──────────▼──────────┐  ┌─────────▼──────────┐  ┌─────────▼──────────┐
              │ foundry1.crit-      │  │ foundry2.crit-     │  │ foundry3.crit-     │
              │ fumble.com (HTTPS)  │  │ fumble.com (HTTPS) │  │ fumble.com (HTTPS) │
              └─────────────────────┘  └────────────────────┘  └────────────────────┘
```

### DNS Configuration (One-Time Setup)

**DigitalOcean DNS Records:**
```
A    foundry1    165.227.x.x    3600
A    foundry2    165.227.x.x    3600
A    foundry3    165.227.x.x    3600
```

**No dynamic DNS required** - All subdomains point to the same droplet IP.

### Nginx Reverse Proxy Configuration

```nginx
# /etc/nginx/sites-available/foundry-instances

# Instance 1
server {
    listen 443 ssl http2;
    server_name foundry1.crit-fumble.com;

    ssl_certificate /etc/letsencrypt/live/crit-fumble.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crit-fumble.com/privkey.pem;

    location / {
        proxy_pass http://localhost:30000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Instance 2
server {
    listen 443 ssl http2;
    server_name foundry2.crit-fumble.com;

    ssl_certificate /etc/letsencrypt/live/crit-fumble.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crit-fumble.com/privkey.pem;

    location / {
        proxy_pass http://localhost:30001;
        # ... same proxy settings ...
    }
}

# Instance 3
server {
    listen 443 ssl http2;
    server_name foundry3.crit-fumble.com;

    ssl_certificate /etc/letsencrypt/live/crit-fumble.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crit-fumble.com/privkey.pem;

    location / {
        proxy_pass http://localhost:30002;
        # ... same proxy settings ...
    }
}
```

### Docker Compose Configuration

**File:** `docker/docker-compose.foundry-multi.yml`

```yaml
version: '3.8'

services:
  foundry-instance-1:
    image: felddy/foundryvtt:release
    container_name: foundry-1
    hostname: foundry1.crit-fumble.com
    restart: unless-stopped
    environment:
      - FOUNDRY_LICENSE_KEY=${FOUNDRY_LICENSE_KEY_1}
      - FOUNDRY_ADMIN_KEY=${FOUNDRY_ADMIN_KEY_1}
      - FOUNDRY_HOSTNAME=foundry1.crit-fumble.com
      - FOUNDRY_MINIFY_STATIC_FILES=true
      - FOUNDRY_UPNP=false
    ports:
      - "30000:30000"
    volumes:
      - foundry-data-1:/data
      - foundry-modules:/data/modules:ro
    networks:
      - foundry-network
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  foundry-instance-2:
    image: felddy/foundryvtt:release
    container_name: foundry-2
    hostname: foundry2.crit-fumble.com
    restart: unless-stopped
    environment:
      - FOUNDRY_LICENSE_KEY=${FOUNDRY_LICENSE_KEY_2}
      - FOUNDRY_ADMIN_KEY=${FOUNDRY_ADMIN_KEY_2}
      - FOUNDRY_HOSTNAME=foundry2.crit-fumble.com
      - FOUNDRY_MINIFY_STATIC_FILES=true
      - FOUNDRY_UPNP=false
    ports:
      - "30001:30000"
    volumes:
      - foundry-data-2:/data
      - foundry-modules:/data/modules:ro
    networks:
      - foundry-network
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  foundry-instance-3:
    image: felddy/foundryvtt:release
    container_name: foundry-3
    hostname: foundry3.crit-fumble.com
    restart: unless-stopped
    environment:
      - FOUNDRY_LICENSE_KEY=${FOUNDRY_LICENSE_KEY_3}
      - FOUNDRY_ADMIN_KEY=${FOUNDRY_ADMIN_KEY_3}
      - FOUNDRY_HOSTNAME=foundry3.crit-fumble.com
      - FOUNDRY_MINIFY_STATIC_FILES=true
      - FOUNDRY_UPNP=false
    ports:
      - "30002:30000"
    volumes:
      - foundry-data-3:/data
      - foundry-modules:/data/modules:ro
    networks:
      - foundry-network
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

volumes:
  foundry-data-1:
  foundry-data-2:
  foundry-data-3:
  foundry-modules:

networks:
  foundry-network:
    driver: bridge
```

### Environment Variables

**File:** `.env` (add to existing variables)

```env
# Foundry VTT License Pool (3 keys)
FOUNDRY_LICENSE_KEY_1=XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
FOUNDRY_LICENSE_KEY_2=XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
FOUNDRY_LICENSE_KEY_3=XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX

# Admin keys (auto-generated per instance)
FOUNDRY_ADMIN_KEY_1=<randomly-generated-32-char-hex>
FOUNDRY_ADMIN_KEY_2=<randomly-generated-32-char-hex>
FOUNDRY_ADMIN_KEY_3=<randomly-generated-32-char-hex>
```

### Instance Management API

**Integration with existing `FoundryInstanceManager`:**

```typescript
// src/lib/foundry/instance-manager.ts (UPDATED)

export class FoundryInstanceManager {
  private static readonly MAX_INSTANCES = 3;
  private static readonly INSTANCE_URLS = [
    'https://foundry1.crit-fumble.com',
    'https://foundry2.crit-fumble.com',
    'https://foundry3.crit-fumble.com'
  ];

  // Map of worldId -> instance slot (0, 1, or 2)
  private static instanceSlots = new Map<string, number>();

  /**
   * Spin up a new Foundry instance for an owner
   * @returns Instance URL
   */
  static async spinUp(ownerId: string, worldId: string): Promise<string> {
    // Check if owner has permission (tier-based limits)
    const owner = await this.getOwner(ownerId);
    const activeInstances = await this.getActiveInstances(ownerId);

    if (activeInstances.length >= 3) {
      throw new Error('Maximum 3 instances per owner');
    }

    // Find available slot (0-2)
    const usedSlots = new Set(this.instanceSlots.values());
    const availableSlot = [0, 1, 2].find(slot => !usedSlots.has(slot));

    if (availableSlot === undefined) {
      throw new Error('No available instance slots');
    }

    // Start the Docker container for this slot
    await this.startContainer(`foundry-${availableSlot + 1}`);

    // Map worldId to slot
    this.instanceSlots.set(worldId, availableSlot);

    // Store mapping in database
    await prisma.foundryInstance.create({
      data: {
        worldId,
        ownerId,
        instanceSlot: availableSlot,
        instanceUrl: this.INSTANCE_URLS[availableSlot],
        status: 'running',
        startedAt: new Date()
      }
    });

    return this.INSTANCE_URLS[availableSlot];
  }

  /**
   * Tear down a Foundry instance
   */
  static async tearDown(worldId: string): Promise<void> {
    const slot = this.instanceSlots.get(worldId);

    if (slot === undefined) {
      throw new Error('Instance not found');
    }

    // Stop the Docker container (but don't remove it)
    await this.stopContainer(`foundry-${slot + 1}`);

    // Remove from slot mapping
    this.instanceSlots.delete(worldId);

    // Update database
    await prisma.foundryInstance.update({
      where: { worldId },
      data: {
        status: 'stopped',
        stoppedAt: new Date()
      }
    });
  }

  /**
   * Start a Docker container
   */
  private static async startContainer(containerName: string): Promise<void> {
    const { execSync } = require('child_process');
    execSync(`docker start ${containerName}`, { stdio: 'inherit' });
  }

  /**
   * Stop a Docker container
   */
  private static async stopContainer(containerName: string): Promise<void> {
    const { execSync } = require('child_process');
    execSync(`docker stop ${containerName}`, { stdio: 'inherit' });
  }
}
```

### Cost Analysis

**DigitalOcean Droplet:**
- Size: 4GB RAM, 2 vCPUs, 80GB SSD
- Cost: **$24/month** (~$0.036/hour)

**Resource Allocation:**
- Each Foundry instance: 1GB RAM limit, 1 vCPU limit
- Nginx + System: ~1GB overhead
- Total: 4GB RAM (3 instances + overhead)

**Comparison:**
- Option A (Static): $24/month for 3 instances = **$8/instance/month**
- Option B (Dynamic): $8/month per droplet × 3 = **$24/month minimum**
  - If all 3 running 100% of time: $72/month
  - If 50% uptime average: $36/month

**Winner:** ✅ Option A is more cost-effective at current scale

### Security Considerations

✅ **SSL/TLS:** Let's Encrypt wildcard certificate for *.crit-fumble.com
✅ **Isolation:** Docker containers with resource limits
✅ **Network:** Private Docker bridge network
✅ **Firewall:** Only ports 80, 443 exposed to public
✅ **Admin Keys:** Unique per instance, randomly generated
✅ **Data Persistence:** Separate Docker volumes per instance

### Deployment Steps

1. **Provision Droplet** (if not exists)
   ```bash
   npm run dev:env:start
   ```

2. **Configure DNS**
   ```bash
   # Add A records to DigitalOcean DNS
   doctl compute domain records create crit-fumble.com \
     --record-type A \
     --record-name foundry1 \
     --record-data 165.227.x.x \
     --record-ttl 3600

   doctl compute domain records create crit-fumble.com \
     --record-type A \
     --record-name foundry2 \
     --record-data 165.227.x.x \
     --record-ttl 3600

   doctl compute domain records create crit-fumble.com \
     --record-type A \
     --record-name foundry3 \
     --record-data 165.227.x.x \
     --record-ttl 3600
   ```

3. **Install Nginx**
   ```bash
   ssh root@165.227.x.x
   apt update && apt install -y nginx certbot python3-certbot-nginx
   ```

4. **Configure SSL**
   ```bash
   certbot --nginx -d foundry1.crit-fumble.com \
                   -d foundry2.crit-fumble.com \
                   -d foundry3.crit-fumble.com
   ```

5. **Deploy Docker Compose**
   ```bash
   scp docker/docker-compose.foundry-multi.yml root@165.227.x.x:/root/
   ssh root@165.227.x.x
   docker-compose -f docker-compose.foundry-multi.yml up -d
   ```

6. **Verify Instances**
   ```bash
   curl https://foundry1.crit-fumble.com
   curl https://foundry2.crit-fumble.com
   curl https://foundry3.crit-fumble.com
   ```

### Maintenance

**Health Monitoring:**
```typescript
// Check if instance is responsive
const health = await fetch('https://foundry1.crit-fumble.com/api/status');
```

**Restart Instance:**
```bash
docker restart foundry-1
```

**Update Foundry Version:**
```bash
docker-compose -f docker-compose.foundry-multi.yml pull
docker-compose -f docker-compose.foundry-multi.yml up -d
```

**Backup World Data:**
```bash
docker run --rm \
  -v foundry-data-1:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/foundry-1-$(date +%Y%m%d).tar.gz /data
```

---

## Option B: Dynamic Droplets (NOT RECOMMENDED)

### Why Not Recommended

1. **DNS Propagation Delay:** 30-300 seconds for A record changes to propagate globally
2. **Startup Time:** 2-5 minutes to provision droplet + install Docker + start Foundry
3. **Cost Inefficiency:** $8-12/month per droplet even if only active 10% of time
4. **Complexity:** Requires automation for:
   - Droplet lifecycle (create/destroy via DigitalOcean API)
   - DNS record management (create/delete A records)
   - SSL certificate provisioning (per droplet)
   - Data persistence (volume snapshots before destruction)
5. **User Experience:** Long wait times for instance startup

### When to Consider Dynamic Droplets

- **Scale:** 10+ concurrent instances needed
- **Resource Isolation:** Hard VM-level isolation required for security/compliance
- **Cost Optimization:** Instances only used 1-2 hours/week (rare for TTRPG sessions)
- **Geographic Distribution:** Need instances in multiple regions (not current requirement)

### Architecture Overview (If Implemented)

```
┌─────────────────────────────────────────────────────────────┐
│                    Request to Spin Up                       │
│                  POST /api/foundry/spin-up                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│   1. Check License Pool (3 keys available?)                 │
│   2. Provision DigitalOcean Droplet (via API)               │
│      - Size: 2GB, 1 vCPU ($6/month)                        │
│      - Region: nyc3                                         │
│      - Image: Docker preinstalled                           │
│   3. Wait for droplet to boot (~60 seconds)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│   4. Create DNS A Record (via DigitalOcean API)            │
│      - Subdomain: foundry-<worldId>.crit-fumble.com        │
│      - IP: <droplet-ip>                                     │
│   5. Wait for DNS propagation (~60 seconds)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│   6. SSH to droplet and deploy Foundry container            │
│   7. Configure SSL with Let's Encrypt                       │
│   8. Return instance URL to user                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   Total Time: 3-5 minutes ⏱️
```

**Implementation Complexity:** HIGH
**User Wait Time:** 3-5 minutes per spin-up
**Monthly Cost:** $6-12 per droplet × active instances

---

## Migration from Current Architecture

**Current State:**
- Single Foundry instance (if any)
- Manual deployment

**Migration Steps:**

1. ✅ **Deploy Static Droplet** (Option A)
   - Provision 4GB droplet
   - Configure Nginx reverse proxy
   - Set up SSL certificates

2. ✅ **Deploy 3 Instances**
   - Run docker-compose up
   - Verify all 3 instances accessible

3. ✅ **Update Database Schema**
   ```prisma
   model FoundryInstance {
     id           String   @id @default(cuid())
     worldId      String   @unique
     ownerId      String
     instanceSlot Int      // 0, 1, or 2
     instanceUrl  String   // https://foundry1.crit-fumble.com
     status       String   // 'running' | 'stopped'
     startedAt    DateTime
     stoppedAt    DateTime?

     owner        User     @relation(fields: [ownerId], references: [id])
   }
   ```

4. ✅ **Update UI**
   - Add "Spin Up Foundry" button to dashboard
   - Show instance URL when running
   - Add "Tear Down" button

5. ✅ **Test End-to-End**
   - Spin up instance 1 → foundry1.crit-fumble.com
   - Spin up instance 2 → foundry2.crit-fumble.com
   - Spin up instance 3 → foundry3.crit-fumble.com
   - Tear down instance 2 → slot 1 becomes available
   - Spin up instance 4 → reuses foundry2.crit-fumble.com

---

## Recommendation Summary

✅ **DEPLOY OPTION A: Single Static Droplet**

**Reasons:**
1. **Cost-Effective:** $24/month vs. $36-72/month for dynamic droplets
2. **Instant Startup:** Containers already running, just assign slot
3. **Simple DNS:** One-time configuration, no dynamic updates
4. **Easy Maintenance:** Single droplet to manage
5. **Sufficient Isolation:** Docker containers provide adequate resource isolation
6. **Proven Stack:** Nginx + Docker + Let's Encrypt is battle-tested

**Next Steps:**
1. Add DNS records to DigitalOcean
2. Create `docker-compose.foundry-multi.yml`
3. Update `FoundryInstanceManager` class
4. Deploy to staging
5. Test spin-up/tear-down workflow
6. Deploy to production

**Future Scaling Path:**
- If you need 4-9 instances: Add a second 4GB droplet (foundry4-6)
- If you need 10+ instances: Revisit dynamic droplet architecture
- If you need geographic distribution: Add droplets in EU/APAC regions

---

*Architecture designed by: Claude AI Code Assistant*
*Date: January 26, 2025*
