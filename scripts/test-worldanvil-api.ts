/**
 * Test script to verify World Anvil API connectivity
 * Run with: npx tsx scripts/test-worldanvil-api.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import axios from 'axios';

// Load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const WORLD_ANVIL_API_BASE = 'https://www.worldanvil.com/api/external/boromir';

async function testWorldAnvilConnectivity() {
  console.log('Testing World Anvil API connectivity...\n');

  // Test 1: Basic HTTP connectivity
  console.log('Test 1: Basic HTTP connectivity to World Anvil');
  console.log(`Fetching: ${WORLD_ANVIL_API_BASE}`);
  try {
    const response = await axios.get(WORLD_ANVIL_API_BASE, {
      headers: {
        'User-Agent': 'Crit-Fumble/1.0 (https://www.crit-fumble.com)',
        'Accept': 'application/json',
      },
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
    });

    console.log(`✓ Status: ${response.status} ${response.statusText}`);
    console.log(`✓ Headers:`, Object.keys(response.headers));

    if (response.headers['server']) {
      console.log(`✓ Server: ${response.headers['server']}`);
    }

    if (response.headers['cf-ray']) {
      console.log(`✓ Cloudflare Ray ID: ${response.headers['cf-ray']}`);
      console.log(`✓ Cloudflare is ACTIVE (request proxied through Cloudflare)`);
    }

    if (response.status === 401 || response.status === 403) {
      console.log('✓ API is accessible (authentication required as expected)');
    } else if (response.status >= 200 && response.status < 300) {
      console.log('✓ API is accessible');
    } else if (response.status === 503 || response.status === 403) {
      console.log('✗ Cloudflare may be blocking the request');
      console.log('Response data:', response.data);
    }
  } catch (error: any) {
    console.log('✗ Connection failed:',  error.message);
    if (error.code) {
      console.log(`  Error code: ${error.code}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Try accessing documentation endpoint
  console.log('Test 2: Access API documentation');
  console.log(`Fetching: ${WORLD_ANVIL_API_BASE}/documentation`);
  try {
    const response = await axios.get(`${WORLD_ANVIL_API_BASE}/documentation`, {
      headers: {
        'User-Agent': 'Crit-Fumble/1.0 (https://www.crit-fumble.com)',
        'Accept': 'application/json',
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    console.log(`✓ Status: ${response.status} ${response.statusText}`);

    if (response.status >= 200 && response.status < 300) {
      console.log('✓ Documentation endpoint accessible');
    }
  } catch (error: any) {
    console.log('✗ Documentation access failed:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Check if environment variables are set
  console.log('Test 3: Environment configuration check');
  // WORLD_ANVIL_CLIENT_SECRET is actually the application key
  const apiKey = process.env.WORLD_ANVIL_API_KEY || process.env.WORLD_ANVIL_CLIENT_SECRET;
  const authToken = process.env.WORLD_ANVIL_AUTH_TOKEN || process.env.WORLD_ANVIL_TOKEN;
  const clientId = process.env.WORLD_ANVIL_CLIENT_ID;

  if (apiKey) {
    console.log(`✓ Application Key (x-application-key) is set (${apiKey.substring(0, 8)}...)`);
  } else {
    console.log('✗ Application Key is not set');
  }

  if (authToken) {
    console.log(`✓ User Token (x-auth-token) is set (${authToken.substring(0, 8)}...)`);
  } else {
    console.log('✗ User Token is not set');
  }

  if (clientId) {
    console.log(`✓ Client ID (username) is set: ${clientId}`);
  } else {
    console.log('✗ Client ID is not set');
  }

  // Test 4: Try identity endpoint with query parameters (bypass Cloudflare)
  if (authToken && apiKey) {
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('Test 4: Identity endpoint (using query parameters to bypass Cloudflare)');
    const queryUrl = `${WORLD_ANVIL_API_BASE}/user/identity?x-application-key=${encodeURIComponent(apiKey)}&x-auth-token=${encodeURIComponent(authToken)}`;
    console.log(`Fetching: ${WORLD_ANVIL_API_BASE}/user/identity?x-application-key=...&x-auth-token=...`);

    try {
      const response = await axios.get(queryUrl, {
        headers: {
          'User-Agent': 'Crit-Fumble/1.0 (https://www.crit-fumble.com)',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log(`✓ Status: ${response.status} ${response.statusText}`);

      if (response.status === 200) {
        console.log('✓ Successfully authenticated!');
        console.log('✓ Identity data:', JSON.stringify(response.data, null, 2));
      } else if (response.status === 401) {
        console.log('✗ Authentication failed - invalid credentials');
        console.log('Response:', typeof response.data === 'string' ? response.data.substring(0, 200) : response.data);
      } else if (response.status === 403) {
        console.log('✗ Forbidden - Cloudflare still blocking or invalid permissions');
        console.log('Response type:', typeof response.data);
        if (typeof response.data === 'string' && response.data.includes('Just a moment')) {
          console.log('  → Cloudflare challenge detected');
        }
      } else {
        console.log('Response:', response.data);
      }
    } catch (error: any) {
      console.log('✗ Identity request failed:', error.message);
    }
  }

  // Test 5: Try full authenticated request with app key + user token
  if (apiKey && authToken) {
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('Test 5: Full authenticated API request (app key + user token)');
    console.log(`Fetching: ${WORLD_ANVIL_API_BASE}/user`);

    try {
      const response = await axios.get(`${WORLD_ANVIL_API_BASE}/user`, {
        headers: {
          'User-Agent': 'Crit-Fumble/1.0 (https://www.crit-fumble.com)',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-application-key': apiKey,
          'x-auth-token': authToken,
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log(`✓ Status: ${response.status} ${response.statusText}`);

      if (response.status === 200) {
        console.log('✓ Successfully authenticated with app key + user token!');
        console.log('✓ User data:', JSON.stringify(response.data, null, 2));
      } else if (response.status === 401) {
        console.log('✗ Authentication failed - invalid credentials');
        console.log('Response:', response.data);
      } else if (response.status === 403) {
        console.log('✗ Forbidden - check API key permissions');
        console.log('Response:', response.data);
      } else {
        console.log('Response:', response.data);
      }
    } catch (error: any) {
      console.log('✗ Authenticated request failed:', error.message);
    }
  }

  // Test 6: Try to get user's worlds
  if (authToken) {
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('Test 6: Get user worlds (with user token)');
    console.log(`Fetching: ${WORLD_ANVIL_API_BASE}/user/worlds`);

    try {
      const response = await axios.get(`${WORLD_ANVIL_API_BASE}/user/worlds`, {
        headers: {
          'User-Agent': 'Crit-Fumble/1.0 (https://www.crit-fumble.com)',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-auth-token': authToken,
          ...(apiKey ? { 'x-application-key': apiKey } : {}),
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log(`✓ Status: ${response.status} ${response.statusText}`);

      if (response.status === 200) {
        console.log('✓ Successfully fetched worlds!');
        const worlds = response.data;
        if (Array.isArray(worlds)) {
          console.log(`✓ Found ${worlds.length} world(s)`);
          worlds.forEach((world: any, idx: number) => {
            console.log(`  ${idx + 1}. ${world.title || world.name || 'Unnamed'} (ID: ${world.id})`);
          });
        } else {
          console.log('✓ Worlds data:', JSON.stringify(worlds, null, 2));
        }
      } else if (response.status === 401) {
        console.log('✗ Authentication failed');
        console.log('Response:', response.data);
      } else if (response.status === 403) {
        console.log('✗ Forbidden - may require application key');
        console.log('Response:', response.data);
      } else {
        console.log('Response:', response.data);
      }
    } catch (error: any) {
      console.log('✗ Worlds request failed:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nSummary:');
  console.log('If you see a Cloudflare Ray ID above, the API is behind Cloudflare.');
  console.log('If status is 401/403, the API is accessible but requires valid credentials.');
  console.log('If status is 503 or connection times out, Cloudflare may be blocking.');
  console.log('\nNext steps:');
  console.log('1. Set WORLD_ANVIL_API_KEY and WORLD_ANVIL_AUTH_TOKEN in your .env');
  console.log('2. Get API key from: https://www.worldanvil.com/api/auth/key');
  console.log('3. Requires Guild membership (Grandmaster rank for app keys)');
}

testWorldAnvilConnectivity().catch(console.error);
