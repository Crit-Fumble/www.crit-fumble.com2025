# Foundry VTT Environment Variables

Complete reference for all environment variables used in the Foundry VTT deployment architecture.

## Table of Contents

- [DigitalOcean Droplet Variables](#digitalocean-droplet-variables)
- [Vercel Variables](#vercel-variables)
- [Generating Secrets](#generating-secrets)
- [Container Configuration](#container-configuration)
- [Security Checklist](#security-checklist)

---

## DigitalOcean Droplet Variables

These variables are set on the DigitalOcean droplet running the Foundry VTT management API.

**Location:** `/root/.env` on the droplet

### Management API Secrets

```bash
# Staging environment bearer token
FOUNDRY_MANAGEMENT_SECRET_STAGING=<64-char-hex-string>

# Production environment bearer token
FOUNDRY_MANAGEMENT_SECRET_PROD=<64-char-hex-string>
```

**Purpose:** Authenticate API requests from Vercel. Different tokens for staging vs production provide environment isolation.

**Security:** Never commit these to git. Store securely.

### Server Configuration

```bash
# Port for the management API (default: 3001)
PORT=3001

# Host to bind to (default: 0.0.0.0)
HOST=0.0.0.0

# Node environment
NODE_ENV=production
```

### Foundry License Keys

```bash
# Staging licenses (containers 1-3, ports 30000-30002)
FOUNDRY_LICENSE_KEY_STAGING_1=<license-key>
FOUNDRY_LICENSE_KEY_STAGING_2=<license-key>
FOUNDRY_LICENSE_KEY_STAGING_3=<license-key>

# Production licenses (containers 4-6, ports 30100-30102)
FOUNDRY_LICENSE_KEY_PROD_1=<license-key>
FOUNDRY_LICENSE_KEY_PROD_2=<license-key>
FOUNDRY_LICENSE_KEY_PROD_3=<license-key>
```

**Note:** In the current architecture, you have 3 licenses total. You can use the same 3 licenses for both environments, or separate them if you prefer.

### Core Concepts API Configuration

```bash
# Staging API endpoint
CORE_CONCEPTS_API_URL_STAGING=https://www-git-staging.crit-fumble.vercel.app/api

# Production API endpoint
CORE_CONCEPTS_API_URL_PROD=https://www.crit-fumble.com/api

# API authentication keys
CORE_CONCEPTS_API_KEY_STAGING=<api-key>
CORE_CONCEPTS_API_KEY_PROD=<api-key>
```

---

## Vercel Variables

These variables are set in the Vercel dashboard for both staging and production environments.

**Location:** Vercel Dashboard → Project Settings → Environment Variables

### Required for Both Environments

```bash
# Droplet IP address (same for both environments - shared droplet)
FOUNDRY_DROPLET_IP=<droplet-ip-address>

# Management API URL
FOUNDRY_MANAGEMENT_API_URL=https://<droplet-ip>:3001

# Bearer tokens (must match droplet configuration)
FOUNDRY_MANAGEMENT_SECRET_STAGING=<same-as-droplet-staging-secret>
FOUNDRY_MANAGEMENT_SECRET_PROD=<same-as-droplet-prod-secret>
```

### Environment Detection

Vercel automatically sets `VERCEL_ENV` to one of:
- `production` - Production deployment
- `preview` - Preview/staging deployment
- `development` - Local development

Your code uses this to select the appropriate bearer token:

```typescript
const isProduction = process.env.VERCEL_ENV === 'production';
const managementSecret = isProduction
  ? process.env.FOUNDRY_MANAGEMENT_SECRET_PROD
  : process.env.FOUNDRY_MANAGEMENT_SECRET_STAGING;
```

---

## Generating Secrets

### Management API Bearer Tokens

Generate cryptographically secure 64-character hex strings:

```bash
# Generate staging secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate production secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output:
```
a7f3e9c8b2d4f1a6e8c9b3d5f2a7e9c8b4d6f1a8e9c3b5d7f2a9e8c4b6d1f3a7
```

**CRITICAL:**
- Generate **different** secrets for staging and production
- Never reuse secrets across environments
- Store securely (password manager, secrets vault)
- Never commit to git

### API Keys

For Core Concepts API keys, use the same method or your preferred secret generation tool.

---

## Container Configuration

### Port Allocation

The architecture uses a 100-port gap to clearly separate environments:

| Environment | Containers | Ports | Bearer Token |
|-------------|-----------|-------|--------------|
| **Staging** | foundry-1, foundry-2, foundry-3 | 30000, 30001, 30002 | `FOUNDRY_MANAGEMENT_SECRET_STAGING` |
| **Production** | foundry-4, foundry-5, foundry-6 | 30100, 30101, 30102 | `FOUNDRY_MANAGEMENT_SECRET_PROD` |

### Container Naming

Containers are numbered 1-6:
- **1-3:** Staging environment
- **4-6:** Production environment

The management API validates that staging tokens can only control containers 1-3, and production tokens can only control containers 4-6.

---

## Security Checklist

Before deploying to production, verify:

### ✅ Droplet Security

- [ ] Different bearer tokens for staging and production
- [ ] Tokens are 64+ characters of cryptographic randomness
- [ ] `.env` file permissions set to `600` (readable only by owner)
- [ ] UFW firewall configured to allow port 3001 ONLY from Vercel IPs
- [ ] SSH configured for key-only authentication (no passwords)
- [ ] All secrets stored in password manager

### ✅ Vercel Configuration

- [ ] `FOUNDRY_MANAGEMENT_SECRET_STAGING` set in Vercel (all environments)
- [ ] `FOUNDRY_MANAGEMENT_SECRET_PROD` set in Vercel (production only)
- [ ] `FOUNDRY_DROPLET_IP` set correctly
- [ ] Environment variables marked as "Encrypted" in Vercel dashboard
- [ ] No secrets committed to git repository

### ✅ Testing

- [ ] Staging can start/stop containers 1-3 only
- [ ] Production can start/stop containers 4-6 only
- [ ] Staging token rejected when sent to production
- [ ] Production token rejected when sent to staging
- [ ] Health check endpoint accessible without authentication
- [ ] Other endpoints return 401 without valid token

---

## Example Configurations

### Droplet `.env` File

```bash
# /root/.env on DigitalOcean droplet

# Management API secrets
FOUNDRY_MANAGEMENT_SECRET_STAGING=a7f3e9c8b2d4f1a6e8c9b3d5f2a7e9c8b4d6f1a8e9c3b5d7f2a9e8c4b6d1f3a7
FOUNDRY_MANAGEMENT_SECRET_PROD=b8g4f0d9c3e5g2b7f9d0c4f6b3f8g0d9c5e7g2c9e4f6c8e3b7f0d2e8c5f7b2g4

# Server config
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# Foundry licenses (using same 3 licenses for both environments in this example)
FOUNDRY_LICENSE_KEY_STAGING_1=YOUR_LICENSE_KEY_1
FOUNDRY_LICENSE_KEY_STAGING_2=YOUR_LICENSE_KEY_2
FOUNDRY_LICENSE_KEY_STAGING_3=YOUR_LICENSE_KEY_3
FOUNDRY_LICENSE_KEY_PROD_1=YOUR_LICENSE_KEY_1
FOUNDRY_LICENSE_KEY_PROD_2=YOUR_LICENSE_KEY_2
FOUNDRY_LICENSE_KEY_PROD_3=YOUR_LICENSE_KEY_3

# Core Concepts API
CORE_CONCEPTS_API_URL_STAGING=https://www-git-staging.crit-fumble.vercel.app/api
CORE_CONCEPTS_API_URL_PROD=https://www.crit-fumble.com/api
CORE_CONCEPTS_API_KEY_STAGING=staging_api_key_here
CORE_CONCEPTS_API_KEY_PROD=production_api_key_here
```

### Vercel Environment Variables

In Vercel Dashboard → crit-fumble.com → Settings → Environment Variables:

| Name | Value | Environments |
|------|-------|--------------|
| `FOUNDRY_DROPLET_IP` | `123.456.789.012` | Production, Preview, Development |
| `FOUNDRY_MANAGEMENT_API_URL` | `https://123.456.789.012:3001` | Production, Preview, Development |
| `FOUNDRY_MANAGEMENT_SECRET_STAGING` | `a7f3e9c8...` | Production, Preview, Development |
| `FOUNDRY_MANAGEMENT_SECRET_PROD` | `b8g4f0d9...` | Production, Preview, Development |

**Note:** Both tokens are available in all Vercel environments, but the code selects which one to use based on `VERCEL_ENV`.

---

## Troubleshooting

### "Invalid authentication token" Error

**Check:**
1. Token in Vercel matches token on droplet (exact character match)
2. `X-Environment` header matches the environment you're trying to access
3. No extra whitespace in environment variable values

### "Container does not belong to environment" Error

**Check:**
1. Staging requests are trying to control containers 1-3 only
2. Production requests are trying to control containers 4-6 only
3. Container name format is `foundry-N` where N is 1-6

### Connection Refused to Management API

**Check:**
1. Management API server is running on droplet
2. UFW firewall allows traffic from Vercel IPs to port 3001
3. `FOUNDRY_DROPLET_IP` is correct in Vercel
4. Using HTTPS in the URL (if SSL configured)

---

## References

- [Foundry VTT Multi-Instance Architecture](./FOUNDRY_MULTI_INSTANCE_ARCHITECTURE.md)
- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [DigitalOcean Firewall Guide](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu-20-04)
