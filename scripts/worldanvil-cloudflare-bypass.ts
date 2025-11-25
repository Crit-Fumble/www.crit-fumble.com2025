/**
 * World Anvil API - Cloudflare Bypass Script
 *
 * This script uses Playwright to solve Cloudflare challenges and extract cookies
 * that can be used for subsequent API requests.
 */

import { chromium } from 'playwright';
import { config } from 'dotenv';
import { resolve } from 'path';
import axios from 'axios';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const WORLD_ANVIL_API_BASE = 'https://www.worldanvil.com/api/external/boromir';

interface CloudflareCookies {
  cfClearance?: string;
  cfBm?: string;
  [key: string]: string | undefined;
}

/**
 * Use Playwright to solve Cloudflare challenge and get cookies
 */
async function getCloudflareCookies(url: string): Promise<CloudflareCookies> {
  console.log('🌐 Launching browser to solve Cloudflare challenge...\n');

  const browser = await chromium.launch({
    headless: true, // Run in headless mode
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    console.log(`Navigating to: ${url}`);

    // Navigate to the URL and wait for Cloudflare challenge to complete
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for Cloudflare to complete
    console.log('Waiting for Cloudflare challenge to complete...');
    await page.waitForTimeout(5000);

    // Check if we're still on a challenge page
    const title = await page.title();
    console.log(`Page title: ${title}`);

    if (title.includes('Just a moment')) {
      console.log('Still on challenge page, waiting longer...');
      // Wait for navigation away from challenge page
      await page.waitForFunction(
        () => !document.title.includes('Just a moment'),
        { timeout: 30000 }
      );
    }

    // Extract all cookies
    const cookies = await context.cookies();
    console.log(`\n✓ Successfully retrieved ${cookies.length} cookies\n`);

    // Convert to object format
    const cookieObj: CloudflareCookies = {};
    cookies.forEach(cookie => {
      cookieObj[cookie.name] = cookie.value;
      console.log(`  ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
    });

    return cookieObj;
  } finally {
    await browser.close();
  }
}

/**
 * Test API request with Cloudflare cookies using Playwright
 */
async function testApiWithPlaywright(cookies: CloudflareCookies) {
  const apiKey = process.env.WORLD_ANVIL_CLIENT_SECRET;
  const authToken = process.env.WORLD_ANVIL_TOKEN;

  if (!apiKey || !authToken) {
    console.error('❌ Missing API credentials in environment variables');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('Testing API request using Playwright with auth headers');
  console.log('='.repeat(60) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // Add cookies to context
  await context.addCookies(
    Object.entries(cookies).map(([name, value]) => ({
      name,
      value: value || '',
      domain: '.worldanvil.com',
      path: '/',
    }))
  );

  const page = await context.newPage();

  try {
    // Use fetch API within browser context to send custom headers
    const result = await page.evaluate(async ({ url, apiKey, authToken }) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-application-key': apiKey,
            'x-auth-token': authToken,
          },
        });

        const status = response.status;
        const contentType = response.headers.get('content-type');
        const text = await response.text();

        return {
          success: true,
          status,
          contentType,
          body: text,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }, {
      url: `${WORLD_ANVIL_API_BASE}/identity`,
      apiKey,
      authToken,
    });

    if (!result.success) {
      console.log(`\n❌ Fetch failed: ${result.error}`);
      return;
    }

    console.log(`Status: ${result.status}`);
    console.log(`Content-Type: ${result.contentType}`);

    if (result.status === 200) {
      console.log('\n✅ SUCCESS! API request worked with Playwright!\n');
      console.log('Response data:');
      try {
        const jsonData = JSON.parse(result.body);
        console.log(JSON.stringify(jsonData, null, 2));
        return jsonData;
      } catch {
        console.log(result.body);
        return result.body;
      }
    } else if (result.status === 401) {
      console.log('\n⚠️  401 Unauthorized');
      console.log('Response:', result.body);
      console.log('\nThis might mean:');
      console.log('  1. Invalid API credentials');
      console.log('  2. Expired auth token');
      console.log('  3. Incorrect application key');
    } else if (result.status === 404) {
      console.log('\n⚠️  404 Not Found');
      console.log('Response:', result.body);
    } else if (result.body.includes('Just a moment')) {
      console.log('\n❌ Still being blocked by Cloudflare');
    } else {
      console.log(`\n⚠️  Received status ${result.status}`);
      console.log('Response preview:', result.body.substring(0, 200));
    }
  } finally {
    await browser.close();
  }
}

/**
 * Test API request with Cloudflare cookies using axios
 */
async function testApiWithAxios(cookies: CloudflareCookies) {
  const apiKey = process.env.WORLD_ANVIL_CLIENT_SECRET;
  const authToken = process.env.WORLD_ANVIL_TOKEN;

  if (!apiKey || !authToken) {
    console.error('❌ Missing API credentials in environment variables');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('Testing API request with axios + cookies + auth headers');
  console.log('='.repeat(60) + '\n');

  // Build cookie string
  const cookieString = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

  // Try different endpoints
  const endpoints = ['/identity', '/user', '/user/worlds'];

  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);

    try {
      const response = await axios.get(`${WORLD_ANVIL_API_BASE}${endpoint}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'x-application-key': apiKey,
          'x-auth-token': authToken,
          'Cookie': cookieString,
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Referer': 'https://www.worldanvil.com/',
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  Content-Type: ${response.headers['content-type']}`);

      if (response.status === 200) {
        console.log('\n✅ SUCCESS! API request worked with axios!\n');
        console.log('Response data:');
        console.log(JSON.stringify(response.data, null, 2));
        return response.data;
      } else if (response.status === 403 && typeof response.data === 'string' && response.data.includes('Just a moment')) {
        console.log('  ❌ Blocked by Cloudflare');
      } else if (response.status === 404) {
        console.log('  ⚠️  404 Not Found');
      } else {
        console.log(`  ⚠️  Status ${response.status}`);
        console.log('  Response preview:', JSON.stringify(response.data).substring(0, 200));
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`  ❌ Request failed: ${error.message}`);
      } else {
        console.error('  ❌ Unexpected error:', error);
      }
    }
  }
}

/**
 * Save cookies to a file for reuse
 */
async function saveCookies(cookies: CloudflareCookies) {
  const fs = await import('fs/promises');
  const cookieFile = resolve(process.cwd(), '.worldanvil-cookies.json');

  const cookieData = {
    cookies,
    timestamp: new Date().toISOString(),
    expiresIn: '30 minutes (estimated)',
  };

  await fs.writeFile(cookieFile, JSON.stringify(cookieData, null, 2));
  console.log(`\n💾 Cookies saved to: ${cookieFile}`);
  console.log('These cookies can be reused for about 30 minutes\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('World Anvil API - Cloudflare Bypass Test\n');
  console.log('This script will:');
  console.log('1. Use Playwright to solve Cloudflare challenge');
  console.log('2. Extract cookies from the browser');
  console.log('3. Test API request with those cookies\n');

  try {
    // Step 1: Get Cloudflare cookies by visiting the API endpoint
    const cookies = await getCloudflareCookies(`${WORLD_ANVIL_API_BASE}/identity`);

    // Step 2: Save cookies for future use
    await saveCookies(cookies);

    // Step 3: Test API with Playwright first
    await testApiWithPlaywright(cookies);

    // Step 4: Test API with axios
    await testApiWithAxios(cookies);

    console.log('\n' + '='.repeat(60));
    console.log('Next Steps:');
    console.log('='.repeat(60));
    console.log('If the API request succeeded, you can:');
    console.log('1. Load these cookies in your WorldAnvilApiClient');
    console.log('2. Refresh cookies periodically (every 20-30 minutes)');
    console.log('3. Contact World Anvil to fix their Cloudflare configuration');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
