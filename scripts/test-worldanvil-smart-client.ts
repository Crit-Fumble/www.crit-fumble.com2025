/**
 * Test the smart World Anvil client that tries standard requests first,
 * then falls back to Playwright only when needed
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { WorldAnvilPlaywrightClient } from '../src/packages/worldanvil/client/WorldAnvilPlaywrightClient';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function main() {
  console.log('Testing World Anvil Smart Client\n');
  console.log('This client will:');
  console.log('1. Try standard HTTP request first (fast)');
  console.log('2. Fall back to Playwright only if Cloudflare blocks it\n');
  console.log('='.repeat(60) + '\n');

  const apiKey = process.env.WORLD_ANVIL_CLIENT_SECRET;
  const authToken = process.env.WORLD_ANVIL_TOKEN;

  if (!apiKey || !authToken) {
    console.error('❌ Missing required environment variables:');
    console.error('   WORLD_ANVIL_CLIENT_SECRET (application key)');
    console.error('   WORLD_ANVIL_TOKEN (user auth token)');
    process.exit(1);
  }

  // Create the smart client
  const client = new WorldAnvilPlaywrightClient({
    apiKey,
    authToken,
  });

  try {
    // Test 1: Get user identity (first call - will use Playwright)
    console.log('Test 1: Getting user identity (first call)...');
    const identity1 = await client.getIdentity();
    console.log('✓ Identity:', JSON.stringify(identity1, null, 2));
    console.log();

    // Test 2: Get user identity again (should reuse Playwright session)
    console.log('Test 2: Getting user identity (second call - reusing session)...');
    const identity2 = await client.getIdentity();
    console.log('✓ Identity:', JSON.stringify(identity2, null, 2));
    console.log();

    console.log('Note: Both requests used the same Playwright session for efficiency');

    console.log('='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up Playwright resources
    await client.destroy();
  }
}

main();
