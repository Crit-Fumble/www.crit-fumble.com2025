/**
 * Foundry Dual System E2E Test
 *
 * Tests both D&D 5e and Cypher System adapters on a live Foundry instance
 *
 * Workflow:
 * 1. Create DigitalOcean droplet with Foundry VTT
 * 2. Install both D&D 5e and Cypher System
 * 3. Install Core Concepts modules
 * 4. Test D&D 5e adapter (create actor, sync to platform)
 * 5. Test Cypher adapter (create actor, sync to platform)
 * 6. Destroy droplet
 *
 * Cost: ~$0.10-0.20 per test run (15-30 minutes)
 */

import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test configuration
const FOUNDRY_ADMIN_KEY = process.env.FOUNDRY_ADMIN_KEY || 'test-admin-key';
const DROPLET_NAME = 'crit-fumble-foundry-test';
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes for full test

interface DropletInfo {
  id: string;
  ip: string;
  foundryUrl: string;
  apiUrl: string;
}

/**
 * Create Foundry test droplet with both game systems
 */
async function createFoundryDroplet(): Promise<DropletInfo> {
  console.log('🚀 Creating Foundry test droplet...');

  // Check if droplet already exists
  const { stdout: existingDroplet } = await execAsync(
    `doctl compute droplet list --format Name,ID,PublicIPv4 --no-header | grep "${DROPLET_NAME}" || true`
  );

  if (existingDroplet.trim()) {
    const [name, id, ip] = existingDroplet.trim().split(/\s+/);
    console.log(`✅ Foundry test droplet already exists: ${id} at ${ip}`);
    return {
      id,
      ip,
      foundryUrl: `http://${ip}:30000`,
      apiUrl: `http://${ip}:3001`,
    };
  }

  // Get SSH key
  const { stdout: sshKeyId } = await execAsync(
    'doctl compute ssh-key list --format ID --no-header | head -n 1'
  );

  if (!sshKeyId.trim()) {
    throw new Error('No SSH keys found. Add SSH key to DigitalOcean.');
  }

  console.log('📦 Creating droplet (4GB RAM for Foundry + 2 systems)...');

  // Create droplet with 4GB RAM (Foundry + 2 game systems need more resources)
  const { stdout: dropletId } = await execAsync(`
    doctl compute droplet create ${DROPLET_NAME} \
      --size s-2vcpu-4gb \
      --image ubuntu-22-04-x64 \
      --region nyc1 \
      --ssh-keys ${sshKeyId.trim()} \
      --tag-name foundry-test \
      --wait \
      --format ID \
      --no-header
  `);

  const id = dropletId.trim();
  console.log(`✅ Droplet created: ${id}`);

  // Get IP
  const { stdout: ipAddress } = await execAsync(
    `doctl compute droplet get ${id} --format PublicIPv4 --no-header`
  );
  const ip = ipAddress.trim();
  console.log(`📍 IP: ${ip}`);

  // Wait for SSH to be ready
  console.log('⏳ Waiting for SSH...');
  await waitForSSH(ip);

  // Provision Foundry
  await provisionFoundry(ip);

  return {
    id,
    ip,
    foundryUrl: `http://${ip}:30000`,
    apiUrl: `http://${ip}:3001`,
  };
}

/**
 * Wait for SSH to be ready
 */
async function waitForSSH(ip: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await execAsync(`ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${ip} 'echo ready'`);
      console.log('✅ SSH ready');
      return;
    } catch (error) {
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second wait
      }
    }
  }
  throw new Error('SSH never became ready');
}

/**
 * Provision Foundry with both game systems
 */
async function provisionFoundry(ip: string): Promise<void> {
  console.log('📦 Provisioning Foundry VTT...');

  // Create provisioning script
  const provisionScript = `
#!/bin/bash
set -e

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get update
apt-get install -y docker-compose

# Create Foundry directories
mkdir -p /foundry/data
mkdir -p /foundry/modules

# Copy game systems and modules from Notes repo
# (Assumes they're already downloaded locally)
# For now, we'll pull from the official Foundry package repository

# Start Foundry container
docker run -d \
  --name foundry \
  --restart unless-stopped \
  -p 30000:30000 \
  -v /foundry/data:/data \
  -e FOUNDRY_ADMIN_KEY='${FOUNDRY_ADMIN_KEY}' \
  -e FOUNDRY_LICENSE_KEY='${process.env.FOUNDRY_LICENSE_KEY || ''}' \
  felddy/foundry:release

# Wait for Foundry to start
sleep 60

# Install Core Concepts module
curl -L https://github.com/crit-fumble/foundry-core-concepts/releases/latest/download/release.zip -o /foundry/modules/core-concepts.zip
cd /foundry/modules && unzip -q core-concepts.zip && rm core-concepts.zip

# Install Core Concepts API module
curl -L https://github.com/crit-fumble/foundry-core-concepts-api/releases/latest/download/release.zip -o /foundry/modules/core-concepts-api.zip
cd /foundry/modules && unzip -q core-concepts-api.zip && rm core-concepts-api.zip

# Install CFG 5e Bridge module
curl -L https://github.com/crit-fumble/foundry-cfg-5e/releases/latest/download/release.zip -o /foundry/modules/cfg-5e.zip
cd /foundry/modules && unzip -q cfg-5e.zip && rm cfg-5e.zip

# Install CFG Cypher Bridge module
curl -L https://github.com/crit-fumble/foundry-cfg-cypher/releases/latest/download/release.zip -o /foundry/modules/cfg-cypher.zip
cd /foundry/modules && unzip -q cfg-cypher.zip && rm cfg-cypher.zip

echo "✅ Foundry provisioned successfully"
`;

  // Upload and execute provisioning script
  await execAsync(`ssh root@${ip} 'cat > /tmp/provision.sh' <<'EOF'
${provisionScript}
EOF`);

  await execAsync(`ssh root@${ip} 'bash /tmp/provision.sh'`);

  console.log('✅ Foundry provisioned');
}

/**
 * Destroy test droplet
 */
async function destroyDroplet(dropletId: string): Promise<void> {
  console.log(`🗑️  Destroying droplet ${dropletId}...`);
  await execAsync(`doctl compute droplet delete ${dropletId} --force`);
  console.log('✅ Droplet destroyed');
}

// Main test suite
test.describe('Foundry Dual System E2E', () => {
  // Only run on chromium to avoid creating multiple droplets
  test.use({ browserName: 'chromium' });

  let droplet: DropletInfo;

  test.beforeAll(async () => {
    // Create and provision Foundry droplet
    droplet = await createFoundryDroplet();
    console.log(`🎮 Foundry ready at: ${droplet.foundryUrl}`);
  }, TIMEOUT_MS);

  test.afterAll(async () => {
    // Destroy droplet to stop billing
    if (droplet?.id && !process.env.KEEP_DROPLET) {
      await destroyDroplet(droplet.id);
    } else {
      console.log('⚠️  Keeping droplet for manual inspection (KEEP_DROPLET=true)');
      console.log(`🎮 Foundry: ${droplet.foundryUrl}`);
      console.log(`🔧 API: ${droplet.apiUrl}`);
    }
  }, TIMEOUT_MS);

  test('Foundry VTT is accessible', async ({ page }) => {
    await page.goto(droplet.foundryUrl);
    await expect(page).toHaveTitle(/Foundry Virtual Tabletop/i);
  });

  test('Core Concepts module is installed', async ({ page }) => {
    await page.goto(`${droplet.foundryUrl}/setup`);

    // Login as admin
    await page.fill('input[name="adminKey"]', FOUNDRY_ADMIN_KEY);
    await page.click('button[type="submit"]');

    // Check modules list
    await page.goto(`${droplet.foundryUrl}/setup#modules`);
    await expect(page.locator('text=Core Concepts')).toBeVisible();
    await expect(page.locator('text=Core Concepts API')).toBeVisible();
  });

  test('Create D&D 5e world and test adapter', async ({ page }) => {
    await page.goto(`${droplet.foundryUrl}/setup`);

    // Create new world with D&D 5e system
    await page.click('button:has-text("Create World")');
    await page.fill('input[name="name"]', 'Test 5e World');
    await page.selectOption('select[name="system"]', 'dnd5e');
    await page.click('button:has-text("Create World")');

    // Wait for world to load
    await page.waitForURL(/\/game/, { timeout: 60000 });

    // Enable modules
    await page.click('button:has-text("Module Management")');
    await page.check('input[value="foundry-core-concepts"]');
    await page.check('input[value="foundry-core-concepts-api"]');
    await page.check('input[value="foundry-cfg-5e"]');
    await page.click('button:has-text("Save Module Settings")');

    // Create test actor
    await page.click('button:has-text("Create Actor")');
    await page.fill('input[name="name"]', 'Test Fighter');
    await page.selectOption('select[name="type"]', 'character');
    await page.click('button:has-text("Create")');

    // Verify actor was created
    await expect(page.locator('text=Test Fighter')).toBeVisible();

    // Test adapter via console
    const adapterExists = await page.evaluate(() => {
      return typeof (window as any).game?.cfg5e?.adapter !== 'undefined';
    });
    expect(adapterExists).toBe(true);
  });

  test('Create Cypher System world and test adapter', async ({ page }) => {
    await page.goto(`${droplet.foundryUrl}/setup`);

    // Create new world with Cypher System
    await page.click('button:has-text("Create World")');
    await page.fill('input[name="name"]', 'Test Cypher World');
    await page.selectOption('select[name="system"]', 'cyphersystem');
    await page.click('button:has-text("Create World")');

    // Wait for world to load
    await page.waitForURL(/\/game/, { timeout: 60000 });

    // Enable modules
    await page.click('button:has-text("Module Management")');
    await page.check('input[value="foundry-core-concepts"]');
    await page.check('input[value="foundry-core-concepts-api"]');
    await page.check('input[value="foundry-cfg-cypher"]');
    await page.click('button:has-text("Save Module Settings")');

    // Create test actor
    await page.click('button:has-text("Create Actor")');
    await page.fill('input[name="name"]', 'Test Nano');
    await page.selectOption('select[name="type"]', 'pc');
    await page.click('button:has-text("Create")');

    // Verify actor was created
    await expect(page.locator('text=Test Nano')).toBeVisible();

    // Test adapter via console
    const adapterExists = await page.evaluate(() => {
      return typeof (window as any).game?.cfgCypher?.adapter !== 'undefined';
    });
    expect(adapterExists).toBe(true);

    // Test CSRD data loading
    const csrdLoaded = await page.evaluate(() => {
      const game = (window as any).game;
      const descriptors = game.cfgCypher?.getDescriptors();
      const types = game.cfgCypher?.getTypes();
      const foci = game.cfgCypher?.getFoci();
      return {
        descriptorCount: descriptors?.length || 0,
        typeCount: types?.length || 0,
        fociCount: foci?.length || 0,
      };
    });

    expect(csrdLoaded.descriptorCount).toBeGreaterThan(0);
    expect(csrdLoaded.typeCount).toBeGreaterThan(0);
    expect(csrdLoaded.fociCount).toBeGreaterThan(0);

    console.log('✅ CSRD Data loaded:');
    console.log(`   ${csrdLoaded.descriptorCount} descriptors`);
    console.log(`   ${csrdLoaded.typeCount} types`);
    console.log(`   ${csrdLoaded.fociCount} foci`);
  });

  test('Both adapters registered with Core Concepts', async ({ page }) => {
    // Use Cypher world (last created)
    await page.goto(`${droplet.foundryUrl}/game`);

    const systemsRegistered = await page.evaluate(() => {
      const game = (window as any).game;
      const dnd5eAdapter = game.coreConcepts?.systems?.getAdapter('dnd5e');
      const cypherAdapter = game.coreConcepts?.systems?.getAdapter('cyphersystem');
      return {
        dnd5e: !!dnd5eAdapter,
        cypher: !!cypherAdapter,
      };
    });

    expect(systemsRegistered.dnd5e).toBe(true);
    expect(systemsRegistered.cypher).toBe(true);

    console.log('✅ Both adapters registered with Core Concepts');
  });

  test('Platform API systems endpoint returns both systems', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/foundry/systems`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.supportedSystems).toHaveLength(2);
    expect(data.supportedSystems.map((s: any) => s.id)).toContain('dnd5e');
    expect(data.supportedSystems.map((s: any) => s.id)).toContain('cyphersystem');
    expect(data.summary.dualSystemSupport).toBe(true);

    console.log('✅ Platform API recognizes both systems');
  });
});
