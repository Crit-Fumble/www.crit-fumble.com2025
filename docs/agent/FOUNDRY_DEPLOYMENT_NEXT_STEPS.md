# Foundry VTT Deployment - Next Steps

## Droplet Setup Status

✅ **Droplet Created:**
- Name: `foundry-vtt`
- IP: `104.131.164.164`
- Region: NYC3
- Size: 1GB RAM, 1 vCPU, 25GB disk
- Image: Ubuntu with Docker pre-installed

✅ **Bearer Tokens Generated:**
- Staging: `322337dafc14cedc29da748ab00b42231a6b461148f4577be29c22b8930f6728`
- Production: `6afdf7f8087f989631c77980668658da71293db8b2d68aebec2fa5ae61b6f0ac`

✅ **Management API Built:**
- Package: `@crit-fumble/foundryvtt-server`
- Build output: `src/packages/foundryvtt-server/dist/`

## Remaining Tasks

### 1. Configure Vercel Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `FOUNDRY_DROPLET_IP` | `104.131.164.164` | Production, Preview, Development |
| `FOUNDRY_MANAGEMENT_API_URL` | `http://104.131.164.164:3001` | Production, Preview, Development |
| `FOUNDRY_MANAGEMENT_SECRET_STAGING` | `322337dafc14cedc29da748ab00b42231a6b461148f4577be29c22b8930f6728` | Production, Preview, Development |
| `FOUNDRY_MANAGEMENT_SECRET_PROD` | `6afdf7f8087f989631c77980668658da71293db8b2d68aebec2fa5ae61b6f0ac` | Production, Preview, Development |

**URL:** https://vercel.com/hobdaytrains-projects/www-crit-fumble-com-2025/settings/environment-variables

### 2. Deploy Management API to Droplet

```bash
# 1. SSH into droplet
ssh root@104.131.164.164

# 2. Create directory for the server
mkdir -p /root/foundryvtt-server

# 3. Exit SSH and copy files from local machine
scp -r src/packages/foundryvtt-server/dist/ root@104.131.164.164:/root/foundryvtt-server/
scp src/packages/foundryvtt-server/package.json root@104.131.164.164:/root/foundryvtt-server/
scp src/packages/foundryvtt-server/package-lock.json root@104.131.164.164:/root/foundryvtt-server/

# 4. SSH back in
ssh root@104.131.164.164

# 5. Install production dependencies
cd /root/foundryvtt-server
npm install --production

# 6. Test the server
node dist/server.js

# 7. If successful, set up as systemd service (see section below)
```

### 3. Create Systemd Service for Management API

Create `/etc/systemd/system/foundry-api.service`:

```ini
[Unit]
Description=Foundry VTT Management API
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/foundryvtt-server
Environment="NODE_ENV=production"
EnvironmentFile=/root/.env
ExecStart=/usr/bin/node /root/foundryvtt-server/dist/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=foundry-api

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
systemctl daemon-reload
systemctl enable foundry-api
systemctl start foundry-api
systemctl status foundry-api
```

### 4. Configure UFW Firewall

```bash
# Allow SSH (if not already allowed)
ufw allow ssh

# Allow port 3001 from Vercel IPs only
# Note: Get Vercel IPs from https://vercel.com/docs/concepts/edge-network/overview
ufw allow from 76.76.21.0/24 to any port 3001
ufw allow from 76.76.21.0/24 to any port 3001

# Enable firewall
ufw enable

# Check status
ufw status verbose
```

**⚠️ IMPORTANT:** You need to add all Vercel IP ranges. The full list is available at:
https://vercel.com/docs/concepts/edge-network/overview

### 5. Create Docker Containers for Foundry VTT

Create `docker-compose.yml` on the droplet:

```yaml
version: '3.8'

services:
  # Staging containers (1-3)
  foundry-1:
    image: felddy/foundryvtt:latest
    container_name: foundry-1
    hostname: foundry-vtt
    restart: unless-stopped
    ports:
      - "30000:30000"
    volumes:
      - foundry-data-1:/data
      - foundry-modules:/data/Data/modules:ro
    environment:
      - FOUNDRY_LICENSE_KEY=
      - FOUNDRY_HOSTNAME=foundry-1.crit-fumble.com
      - FOUNDRY_PROXY_PORT=30000

  foundry-2:
    image: felddy/foundryvtt:latest
    container_name: foundry-2
    hostname: foundry-vtt
    restart: unless-stopped
    ports:
      - "30001:30000"
    volumes:
      - foundry-data-2:/data
      - foundry-modules:/data/Data/modules:ro
    environment:
      - FOUNDRY_LICENSE_KEY=
      - FOUNDRY_HOSTNAME=foundry-2.crit-fumble.com
      - FOUNDRY_PROXY_PORT=30001

  foundry-3:
    image: felddy/foundryvtt:latest
    container_name: foundry-3
    hostname: foundry-vtt
    restart: unless-stopped
    ports:
      - "30002:30000"
    volumes:
      - foundry-data-3:/data
      - foundry-modules:/data/Data/modules:ro
    environment:
      - FOUNDRY_LICENSE_KEY=
      - FOUNDRY_HOSTNAME=foundry-3.crit-fumble.com
      - FOUNDRY_PROXY_PORT=30002

  # Production containers (4-6)
  foundry-4:
    image: felddy/foundryvtt:latest
    container_name: foundry-4
    hostname: foundry-vtt
    restart: unless-stopped
    ports:
      - "30100:30000"
    volumes:
      - foundry-data-4:/data
      - foundry-modules:/data/Data/modules:ro
    environment:
      - FOUNDRY_LICENSE_KEY=
      - FOUNDRY_HOSTNAME=foundry-4.crit-fumble.com
      - FOUNDRY_PROXY_PORT=30100

  foundry-5:
    image: felddy/foundryvtt:latest
    container_name: foundry-5
    hostname: foundry-vtt
    restart: unless-stopped
    ports:
      - "30101:30000"
    volumes:
      - foundry-data-5:/data
      - foundry-modules:/data/Data/modules:ro
    environment:
      - FOUNDRY_LICENSE_KEY=
      - FOUNDRY_HOSTNAME=foundry-5.crit-fumble.com
      - FOUNDRY_PROXY_PORT=30101

  foundry-6:
    image: felddy/foundryvtt:latest
    container_name: foundry-6
    hostname: foundry-vtt
    restart: unless-stopped
    ports:
      - "30102:30000"
    volumes:
      - foundry-data-6:/data
      - foundry-modules:/data/Data/modules:ro
    environment:
      - FOUNDRY_LICENSE_KEY=
      - FOUNDRY_HOSTNAME=foundry-6.crit-fumble.com
      - FOUNDRY_PROXY_PORT=30102

volumes:
  foundry-data-1:
  foundry-data-2:
  foundry-data-3:
  foundry-data-4:
  foundry-data-5:
  foundry-data-6:
  foundry-modules:
```

Start the containers:

```bash
docker-compose up -d
```

**Note:** Containers will initially have empty `FOUNDRY_LICENSE_KEY`. The management API will inject license keys dynamically when starting instances.

### 6. Configure DNS (Optional)

If you want to use custom domains:

```bash
# Create A records pointing to droplet IP
foundry-1.crit-fumble.com → 104.131.164.164
foundry-2.crit-fumble.com → 104.131.164.164
foundry-3.crit-fumble.com → 104.131.164.164
foundry-4.crit-fumble.com → 104.131.164.164
foundry-5.crit-fumble.com → 104.131.164.164
foundry-6.crit-fumble.com → 104.131.164.164
```

### 7. Test the Setup

1. **Test health endpoint:**
   ```bash
   curl http://104.131.164.164:3001/health
   ```

2. **Test from Vercel (requires auth):**
   ```bash
   curl -X POST https://www.crit-fumble.com/api/foundry/manage \
     -H "Content-Type: application/json" \
     -d '{"action": "status"}'
   ```

3. **Test starting a container (from authenticated user):**
   ```javascript
   // From your Next.js app
   const response = await fetch('/api/foundry/manage', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       action: 'start',
       worldId: 'test-world-123',
       slot: 0,
       licenseKey: 'AEBO-Z0NY-HKLN-STEY-CE87-PMTQ'
     })
   });
   ```

## Architecture Summary

### Dynamic License Key Flow

1. User initiates Foundry instance start from web UI
2. Web app retrieves user's license key from database (or uses platform license)
3. Vercel API route forwards request to droplet management API with license key
4. Management API:
   - Authenticates bearer token
   - Validates environment isolation
   - Stops container if running
   - Recreates container with injected `FOUNDRY_LICENSE_KEY` environment variable
   - Starts container
5. Container boots with user's specific license key

### Security Layers

1. **Bearer Token Authentication** - Dual tokens for staging/production
2. **Environment Isolation** - Staging can only access containers 1-3, production 4-6
3. **Rate Limiting** - 100 requests per 15 minutes per IP
4. **Audit Logging** - All API requests logged with environment and action
5. **UFW Firewall** - Port 3001 only accessible from Vercel IPs
6. **User Authentication** - Vercel route requires Next-Auth session

## Files Modified/Created

- ✅ `src/packages/foundryvtt-server/src/types.ts` - Added `licenseKey` to `StartContainerRequest`
- ✅ `src/packages/foundryvtt-server/src/managers/docker-manager.ts` - Supports dynamic license key injection
- ✅ `src/packages/foundryvtt-server/src/managers/instance-manager.ts` - Passes license key to Docker manager
- ✅ `src/packages/foundryvtt-server/src/api/routes.ts` - Validates and requires license key
- ✅ `src/app/api/foundry/manage/route.ts` - Validates license key before forwarding
- ✅ `docs/agent/FOUNDRY_ENVIRONMENT_VARIABLES.md` - Complete environment variable reference
- ✅ `.env` on droplet - Management secrets and Core Concepts API keys (no license keys)

## Next Actions

1. [ ] Add Vercel environment variables via dashboard
2. [ ] Deploy management API to droplet
3. [ ] Create systemd service
4. [ ] Configure UFW firewall
5. [ ] Create and start Docker containers
6. [ ] Test health endpoint
7. [ ] Test instance start/stop from web app
8. [ ] Set up monitoring/alerts
9. [ ] Configure backups for container volumes
10. [ ] Document user license key management in database
