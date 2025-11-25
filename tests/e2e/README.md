# Foundry VTT E2E Tests

End-to-end tests for Foundry VTT integration with dual system support (D&D 5e + Cypher System).

## Foundry Dual System Test

Tests both D&D 5e and Cypher System adapters on a live Foundry instance running on DigitalOcean.

### What It Tests

1. **Droplet Provisioning**: Creates DigitalOcean droplet with Foundry VTT
2. **Module Installation**: Installs Core Concepts + both game system bridges
3. **D&D 5e Adapter**: Creates world, actor, verifies adapter registration
4. **Cypher Adapter**: Creates world, actor, verifies CSRD data loading
5. **Dual System Support**: Confirms both adapters work together
6. **Platform API**: Tests `/api/foundry/systems` endpoint
7. **Cleanup**: Destroys droplet to stop billing

### Prerequisites

1. **DigitalOcean CLI** (doctl):
   ```bash
   # Windows
   ./scripts/dev/install-doctl.bat

   # macOS
   brew install doctl

   # Linux
   snap install doctl
   ```

2. **Authenticate doctl**:
   ```bash
   doctl auth init
   ```
   Get API token from: https://cloud.digitalocean.com/account/api/tokens

3. **SSH Key**: Must have at least one SSH key in DigitalOcean

4. **Environment Variables** (optional):
   ```bash
   FOUNDRY_LICENSE_KEY=your-license-key  # Optional, for licensed Foundry
   FOUNDRY_ADMIN_KEY=test-admin-key      # Defaults to test-admin-key
   API_TOKEN=your-platform-api-token     # For platform API tests
   ```

### Running the Test

**Standard run** (creates droplet, runs tests, destroys droplet):
```bash
npm run test:e2e:foundry
```

**Keep droplet for inspection** (doesn't destroy after test):
```bash
npm run test:e2e:foundry:keep
```

When keeping droplet, manual cleanup:
```bash
doctl compute droplet list | grep crit-fumble-foundry-test
doctl compute droplet delete <DROPLET_ID> --force
```

### Test Duration & Cost

- **Total time**: 15-30 minutes
  - Droplet creation: 1-2 minutes
  - Foundry provisioning: 5-10 minutes
  - Tests: 5-10 minutes
  - Cleanup: 1 minute

- **Cost**: $0.10-0.20 per test run
  - Droplet: $0.036/hour (4GB RAM, 2 vCPUs)
  - 15 minutes = $0.009
  - 30 minutes = $0.018
  - Rounded up for provision overhead: ~$0.10-0.20

### Test Structure

```typescript
test.describe('Foundry Dual System E2E', () => {
  test.beforeAll(async () => {
    // Create and provision Foundry droplet
    droplet = await createFoundryDroplet();
  });

  test.afterAll(async () => {
    // Destroy droplet (unless KEEP_DROPLET=true)
    if (!process.env.KEEP_DROPLET) {
      await destroyDroplet(droplet.id);
    }
  });

  test('Foundry VTT is accessible', async ({ page }) => {
    // Verify Foundry loads
  });

  test('Core Concepts module is installed', async ({ page }) => {
    // Verify all modules present
  });

  test('Create D&D 5e world and test adapter', async ({ page }) => {
    // Test DnD5eAdapter
  });

  test('Create Cypher System world and test adapter', async ({ page }) => {
    // Test CypherSystemAdapter
  });

  test('Both adapters registered with Core Concepts', async ({ page }) => {
    // Verify SystemsManager has both
  });

  test('Platform API systems endpoint returns both systems', async () => {
    // Test /api/foundry/systems
  });
});
```

### What Gets Installed

**On Droplet:**
- Ubuntu 22.04
- Docker
- FoundryVTT (felddy/foundry container)
- D&D 5e game system (official)
- Cypher System game system (mrkwnzl)

**Foundry Modules:**
- foundry-core-concepts (system-agnostic framework)
- foundry-core-concepts-api (sync engine)
- foundry-cfg-5e (D&D 5e bridge/adapter)
- foundry-cfg-cypher (Cypher bridge/adapter)

### Troubleshooting

**"No SSH keys found"**:
```bash
doctl compute ssh-key create my-key --public-key "$(cat ~/.ssh/id_rsa.pub)"
```

**"doctl is not authenticated"**:
```bash
doctl auth init
```

**"Foundry license required"**:
- Set `FOUNDRY_LICENSE_KEY` environment variable
- Or use demo mode (limited features)

**"Test timeout"**:
- Increase timeout in test file (currently 30 minutes)
- Check droplet status: `doctl compute droplet list`
- SSH to droplet: `ssh root@<IP>`
- Check Foundry logs: `docker logs foundry`

**"Droplet left running"**:
```bash
# Find orphaned droplet
doctl compute droplet list | grep foundry-test

# Destroy manually
doctl compute droplet delete <DROPLET_ID> --force
```

### CI/CD Integration

For CI pipelines (GitHub Actions, etc.), add secrets:
- `DO_API_TOKEN`: DigitalOcean API token
- `FOUNDRY_LICENSE_KEY`: Foundry license (optional)
- `API_TOKEN`: Platform API token

Example GitHub Actions workflow:
```yaml
name: Foundry E2E Tests

on:
  push:
    branches: [main, staging]
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2 AM

jobs:
  foundry-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DO_API_TOKEN }}

      - name: Run Foundry E2E tests
        env:
          FOUNDRY_LICENSE_KEY: ${{ secrets.FOUNDRY_LICENSE_KEY }}
          API_TOKEN: ${{ secrets.API_TOKEN }}
        run: npm run test:e2e:foundry
```

### Manual Droplet Inspection

If using `KEEP_DROPLET=true`, inspect manually:

```bash
# Get droplet info
doctl compute droplet list | grep foundry-test

# SSH to droplet
ssh root@<IP>

# Check Foundry container
docker ps
docker logs foundry

# Access Foundry
# Open browser: http://<IP>:30000
# Admin key: test-admin-key (or your FOUNDRY_ADMIN_KEY)
```

### Architecture Tested

```
┌─────────────────────────────────────────────────┐
│     DigitalOcean Droplet (Ubuntu 22.04)         │
│  ┌───────────────────────────────────────────┐  │
│  │   Foundry VTT Container (port 30000)     │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │  D&D 5e System (official dnd5e)   │  │  │
│  │  └─────────────┬──────────────────────┘  │  │
│  │  ┌─────────────▼──────────────────────┐  │  │
│  │  │  Core Concepts (universal)        │  │  │
│  │  └─────────────┬──────────────────────┘  │  │
│  │  ┌─────────────▼──────────────────────┐  │  │
│  │  │  CFG 5e Bridge (DnD5eAdapter)     │  │  │
│  │  └────────────────────────────────────┘  │  │
│  │                                           │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │  Cypher System (mrkwnzl)          │  │  │
│  │  └─────────────┬──────────────────────┘  │  │
│  │  ┌─────────────▼──────────────────────┐  │  │
│  │  │  Core Concepts (universal)        │  │  │
│  │  └─────────────┬──────────────────────┘  │  │
│  │  ┌─────────────▼──────────────────────┐  │  │
│  │  │  CFG Cypher (CypherSystemAdapter) │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                       │
                       │ HTTP API
                       ▼
┌─────────────────────────────────────────────────┐
│        Crit-Fumble Web Platform                 │
│     GET /api/foundry/systems                    │
│     (returns both dnd5e + cyphersystem)         │
└─────────────────────────────────────────────────┘
```

### Success Criteria

All tests pass if:

1. ✅ Foundry VTT accessible at droplet IP
2. ✅ Both D&D 5e and Cypher System installed
3. ✅ All 4 Core Concepts modules active
4. ✅ D&D 5e world created, actor syncs
5. ✅ Cypher world created, actor syncs
6. ✅ CSRD data loaded (103 descriptors, 4 types, 142 foci)
7. ✅ Both adapters registered with SystemsManager
8. ✅ Platform API returns dual system support
9. ✅ Droplet destroyed (if not keeping)

### Next Steps

After successful test:
- ✅ D&D 5e adapter working
- ✅ Cypher adapter working
- ✅ Dual system support confirmed
- ✅ Ready for March 2026 release

For production deployment, see:
- [Foundry Integration Guide](../../docs/agent/integrations/foundry-integration.md)
- [Production Deployment](../../docs/agent/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)
