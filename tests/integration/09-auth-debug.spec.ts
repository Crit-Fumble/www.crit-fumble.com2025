/**
 * Authentication Debugging Test
 *
 * This test provides detailed debugging information about the auth flow
 * to help diagnose why sessions aren't persisting.
 */

import { test, expect } from '@playwright/test';

test.describe('Auth Debug - Session Investigation', () => {
  test('should debug complete auth flow with detailed logging', async ({ page, context }) => {
    const timestamp = Date.now();
    const testEmail = `auth-debug-${timestamp}@crit-fumble.test`;
    const testUsername = `auth_debug_${timestamp}`;

    console.log('\n========================================');
    console.log('AUTH DEBUG TEST STARTED');
    console.log('========================================\n');

    // ==================================================================
    // STEP 1: Check initial state (no cookies)
    // ==================================================================
    await test.step('Check Initial State', async () => {
      console.log('📍 STEP 1: Checking initial state...');

      await page.goto('/');
      const initialUrl = page.url();
      const initialCookies = await context.cookies();

      console.log('Initial URL:', initialUrl);
      console.log('Initial Cookies:', JSON.stringify(initialCookies, null, 2));
      console.log('Expected: Should redirect to /login\n');
    });

    // ==================================================================
    // STEP 2: Create test session via API
    // ==================================================================
    await test.step('Create Test Session', async () => {
      console.log('📍 STEP 2: Creating test session via /api/test-auth...');

      const authData = await page.evaluate(async ({ email, username }) => {
        const res = await fetch('/api/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, username }),
        });
        return {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          data: await res.json(),
        };
      }, { email: testEmail, username: testUsername });

      console.log('API Response Status:', authData.status, authData.statusText);
      console.log('API Response Headers:', JSON.stringify(authData.headers, null, 2));
      console.log('API Response Data:', JSON.stringify(authData.data, null, 2));

      expect(authData.status).toBe(200);
      expect(authData.data.success).toBe(true);
      console.log('✅ Session created successfully\n');
    });

    // ==================================================================
    // STEP 3: Check cookies after auth
    // ==================================================================
    await test.step('Check Cookies After Auth', async () => {
      console.log('📍 STEP 3: Checking cookies after authentication...');

      await page.waitForTimeout(1000); // Wait for cookies to be set

      const cookiesAfterAuth = await context.cookies();
      console.log('Cookies after auth:', JSON.stringify(cookiesAfterAuth, null, 2));

      const sessionCookie = cookiesAfterAuth.find(c =>
        c.name.includes('session') || c.name.includes('auth')
      );

      if (sessionCookie) {
        console.log('✅ Found session cookie:', sessionCookie.name);
        console.log('   Value (truncated):', sessionCookie.value.substring(0, 50) + '...');
        console.log('   Domain:', sessionCookie.domain);
        console.log('   Path:', sessionCookie.path);
        console.log('   HttpOnly:', sessionCookie.httpOnly);
        console.log('   Secure:', sessionCookie.secure);
        console.log('   SameSite:', sessionCookie.sameSite);
      } else {
        console.log('❌ NO SESSION COOKIE FOUND!');
        console.log('Available cookies:', cookiesAfterAuth.map(c => c.name).join(', '));
      }
      console.log('');
    });

    // ==================================================================
    // STEP 4: Try to access protected route
    // ==================================================================
    await test.step('Try to Access Dashboard', async () => {
      console.log('📍 STEP 4: Attempting to access /dashboard...');

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const pageTitle = await page.title();

      console.log('Current URL:', currentUrl);
      console.log('Page Title:', pageTitle);

      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Successfully accessed dashboard!');
      } else if (currentUrl.includes('/login')) {
        console.log('❌ Redirected to login - session not recognized');
      } else {
        console.log('⚠️  Unexpected redirect:', currentUrl);
      }
      console.log('');
    });

    // ==================================================================
    // STEP 5: Check what the auth() function sees
    // ==================================================================
    await test.step('Check Server-Side Session', async () => {
      console.log('📍 STEP 5: Checking what server sees...');

      // Try to get session via API endpoint
      const sessionCheck = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/auth/session', {
            credentials: 'include',
          });
          return {
            status: res.status,
            data: await res.json().catch(() => ({ error: 'No JSON response' })),
          };
        } catch (error) {
          return {
            status: 0,
            error: String(error),
          };
        }
      });

      console.log('Session API Response:', JSON.stringify(sessionCheck, null, 2));
      console.log('');
    });

    // ==================================================================
    // STEP 6: Try homepage redirect
    // ==================================================================
    await test.step('Try Homepage Redirect', async () => {
      console.log('📍 STEP 6: Testing homepage redirect behavior...');

      await page.goto('/');
      await page.waitForTimeout(1000);

      const finalUrl = page.url();
      console.log('After going to /:', finalUrl);

      if (finalUrl.includes('/dashboard')) {
        console.log('✅ Correctly redirected to dashboard');
      } else if (finalUrl.includes('/login')) {
        console.log('❌ Redirected to login - auth not working');
      } else {
        console.log('⚠️  Unexpected URL:', finalUrl);
      }
      console.log('');
    });

    // ==================================================================
    // STEP 7: Database check (via test endpoint)
    // ==================================================================
    await test.step('Check Database Records', async () => {
      console.log('📍 STEP 7: Checking database records...');

      // We'll need to create a debug endpoint, but let's log what we expect
      console.log('Expected database records:');
      console.log('  - Player with email:', testEmail);
      console.log('  - Account with provider: "test"');
      console.log('  - Session with sessionToken');
      console.log('  - PlayerSession (audit log)');
      console.log('\n💡 Recommendation: Check Prisma Studio to verify these records exist');
      console.log('');
    });

    // ==================================================================
    // STEP 8: Check middleware behavior
    // ==================================================================
    await test.step('Check Middleware', async () => {
      console.log('📍 STEP 8: Analyzing middleware behavior...');

      const cookiesBeforeRequest = await context.cookies();
      console.log('Cookies being sent with request:', cookiesBeforeRequest.map(c => ({
        name: c.name,
        domain: c.domain,
        path: c.path,
      })));

      console.log('\n💡 Things to verify in middleware.ts:');
      console.log('  1. Does it properly read the session cookie?');
      console.log('  2. Does auth() function validate the session?');
      console.log('  3. Are there any console.log statements we can add?');
      console.log('');
    });

    console.log('========================================');
    console.log('AUTH DEBUG TEST COMPLETED');
    console.log('========================================\n');
  });

  test('should compare cookie names between test-auth and NextAuth', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('COOKIE NAME COMPARISON TEST');
    console.log('========================================\n');

    const timestamp = Date.now();

    await test.step('Create test session and inspect cookie name', async () => {
      // Navigate to page first to establish base URL for fetch
      await page.goto('http://localhost:3000');

      const authData = await page.evaluate(async () => {
        const res = await fetch('/api/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: `cookie-test-${Date.now()}@crit-fumble.test`,
            username: `cookie_test_${Date.now()}`,
          }),
        });
        return res.json();
      });

      await page.waitForTimeout(500);
      const cookies = await context.cookies();

      console.log('Test-auth set these cookies:');
      cookies.forEach(cookie => {
        console.log(`  - ${cookie.name}`);
        if (cookie.name.includes('auth') || cookie.name.includes('session')) {
          console.log(`    ⭐ This looks like a session cookie!`);
          console.log(`    Domain: ${cookie.domain}`);
          console.log(`    Path: ${cookie.path}`);
          console.log(`    HttpOnly: ${cookie.httpOnly}`);
        }
      });

      console.log('\n💡 Expected cookie names for Next-Auth v5:');
      console.log('  - authjs.session-token (for localhost)');
      console.log('  - __Secure-authjs.session-token (for HTTPS)');
      console.log('  OR');
      console.log('  - next-auth.session-token (for Next-Auth v4)');
      console.log('  - __Secure-next-auth.session-token (for HTTPS)');
      console.log('');
    });

    console.log('========================================');
    console.log('COOKIE NAME TEST COMPLETED');
    console.log('========================================\n');
  });

  test('should manually set correct cookie and test', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('MANUAL COOKIE INJECTION TEST');
    console.log('========================================\n');

    const timestamp = Date.now();
    const testEmail = `manual-cookie-${timestamp}@crit-fumble.test`;
    const testUsername = `manual_cookie_${timestamp}`;

    await test.step('Create session via API', async () => {
      // Navigate to page first to establish base URL for fetch
      await page.goto('http://localhost:3000');

      const authData = await page.evaluate(async ({ email, username }) => {
        const res = await fetch('/api/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, username }),
        });
        return res.json();
      }, { email: testEmail, username: testUsername });

      console.log('Session Token:', authData.sessionToken);
      console.log('Player ID:', authData.playerId);
      console.log('');

      // Try setting cookie with different names
      const cookieValue = authData.sessionToken;
      const cookieOptions = {
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax' as const,
      };

      // Try Next-Auth v5 name
      await context.addCookies([{
        name: 'authjs.session-token',
        value: cookieValue,
        ...cookieOptions,
      }]);
      console.log('✅ Set cookie: authjs.session-token');

      // Also try Next-Auth v4 name (in case that's what's configured)
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: cookieValue,
        ...cookieOptions,
      }]);
      console.log('✅ Set cookie: next-auth.session-token');
      console.log('');
    });

    await test.step('Test if either cookie works', async () => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);

      if (currentUrl.includes('/dashboard')) {
        console.log('✅ SUCCESS! One of the cookie names worked!');

        const cookies = await context.cookies();
        const workingCookie = cookies.find(c =>
          c.name === 'authjs.session-token' || c.name === 'next-auth.session-token'
        );

        if (workingCookie) {
          console.log('✅ Working cookie name:', workingCookie.name);
          console.log('\n💡 UPDATE test-auth API to use this cookie name!');
        }
      } else {
        console.log('❌ Neither cookie name worked');
        console.log('💡 The issue might be:');
        console.log('   1. Session validation failing in auth.ts');
        console.log('   2. Different cookie name expected');
        console.log('   3. Session not being found in database');
      }
      console.log('');
    });

    console.log('========================================');
    console.log('MANUAL COOKIE TEST COMPLETED');
    console.log('========================================\n');
  });

  test('should show dashboard with random Crit-Coins balance', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('DASHBOARD WITH CRIT-COINS TEST');
    console.log('========================================\n');

    const timestamp = Date.now();
    const testEmail = `coins-test-${timestamp}@crit-fumble.test`;
    const testUsername = `coins_test_${timestamp}`;
    const randomCoins = Math.floor(Math.random() * 300) + 1;

    await test.step('Create session and set Crit-Coins balance', async () => {
      await page.goto('http://localhost:3000');

      const authData = await page.evaluate(async ({ email, username, coins }) => {
        const res = await fetch('/api/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            username,
            critCoins: coins
          }),
        });
        return res.json();
      }, { email: testEmail, username: testUsername, coins: randomCoins });

      console.log('✅ Session created with Crit-Coins:', randomCoins);
      expect(authData.success).toBe(true);
    });

    await test.step('Verify dashboard shows Crit-Coins in header', async () => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      expect(currentUrl).toContain('/dashboard');

      // Check if Crit-Coins balance is visible in header
      const coinsBalance = page.locator('header').getByText(randomCoins.toLocaleString());
      await expect(coinsBalance).toBeVisible();

      console.log('✅ Crit-Coins balance is visible in header');
      console.log('');
    });

    console.log('========================================');
    console.log('CRIT-COINS TEST COMPLETED');
    console.log('========================================\n');
  });

  test('should show dashboard without Story Credits (hidden from UI)', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('DASHBOARD WITH STORY CREDITS TEST');
    console.log('========================================\n');

    const timestamp = Date.now();
    const testEmail = `credits-test-${timestamp}@crit-fumble.test`;
    const testUsername = `credits_test_${timestamp}`;
    const randomCredits = Math.floor(Math.random() * 300) + 1;

    await test.step('Create session and set Story Credits balance', async () => {
      await page.goto('http://localhost:3000');

      const authData = await page.evaluate(async ({ email, username, credits }) => {
        const res = await fetch('/api/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            username,
            storyCredits: credits
          }),
        });
        return res.json();
      }, { email: testEmail, username: testUsername, credits: randomCredits });

      console.log('✅ Session created with Story Credits:', randomCredits);
      expect(authData.success).toBe(true);
    });

    await test.step('Verify dashboard loads (Story Credits not shown in UI)', async () => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      expect(currentUrl).toContain('/dashboard');

      // Verify Story Credits are NOT visible (intentionally hidden)
      const creditsCard = page.locator('text=Story Credits').first();
      await expect(creditsCard).not.toBeVisible();

      console.log('✅ Dashboard loaded successfully (Story Credits hidden as expected)');
      console.log('');
    });

    console.log('========================================');
    console.log('STORY CREDITS TEST COMPLETED');
    console.log('========================================\n');
  });

  test('should show Crit-Coins in header (Story Credits hidden)', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('DASHBOARD WITH BOTH BALANCES TEST');
    console.log('========================================\n');

    const timestamp = Date.now();
    const testEmail = `both-test-${timestamp}@crit-fumble.test`;
    const testUsername = `both_test_${timestamp}`;
    const randomCoins = Math.floor(Math.random() * 300) + 1;
    const randomCredits = Math.floor(Math.random() * 300) + 1;

    await test.step('Create session and set both balances', async () => {
      await page.goto('http://localhost:3000');

      const authData = await page.evaluate(async ({ email, username, coins, credits }) => {
        const res = await fetch('/api/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            username,
            critCoins: coins,
            storyCredits: credits
          }),
        });
        return res.json();
      }, { email: testEmail, username: testUsername, coins: randomCoins, credits: randomCredits });

      console.log('✅ Session created with:');
      console.log('   Crit-Coins:', randomCoins);
      console.log('   Story Credits:', randomCredits);
      expect(authData.success).toBe(true);
    });

    await test.step('Verify Crit-Coins in header, Story Credits hidden', async () => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      expect(currentUrl).toContain('/dashboard');

      // Check if Crit-Coins balance is visible in header
      const coinsBalance = page.locator('header').getByText(randomCoins.toLocaleString());
      await expect(coinsBalance).toBeVisible();

      // Verify Story Credits are NOT visible (intentionally hidden)
      const creditsCard = page.locator('text=Story Credits').first();
      await expect(creditsCard).not.toBeVisible();

      console.log('✅ Crit-Coins visible in header, Story Credits hidden as expected');
      console.log('');
    });

    console.log('========================================');
    console.log('BOTH BALANCES TEST COMPLETED');
    console.log('========================================\n');
  });

  test('should show dashboard in light mode with Crit-Coins', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('LIGHT MODE DASHBOARD TEST');
    console.log('========================================\n');

    const timestamp = Date.now();
    const testEmail = `light-mode-${timestamp}@crit-fumble.test`;
    const testUsername = `light_mode_${timestamp}`;
    const randomCoins = Math.floor(Math.random() * 300) + 1;

    await test.step('Create session and set Crit-Coins balance', async () => {
      await page.goto('http://localhost:3000');

      const authData = await page.evaluate(async ({ email, username, coins }) => {
        const res = await fetch('/api/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            username,
            critCoins: coins
          }),
        });
        return res.json();
      }, { email: testEmail, username: testUsername, coins: randomCoins });

      console.log('✅ Session created with Crit-Coins:', randomCoins);
      expect(authData.success).toBe(true);
    });

    await test.step('Verify dashboard in light mode', async () => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Ensure light mode (remove dark class from html element)
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      await page.waitForTimeout(500);

      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      expect(currentUrl).toContain('/dashboard');

      // Check if Crit-Coins balance is visible in header
      const coinsBalance = page.locator('header').getByText(randomCoins.toLocaleString());
      await expect(coinsBalance).toBeVisible();

      console.log('✅ Dashboard displayed in light mode with Crit-Coins in header');
      console.log('');
    });

    console.log('========================================');
    console.log('LIGHT MODE TEST COMPLETED');
    console.log('========================================\n');
  });

  test('should show dashboard in dark mode with Crit-Coins', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('DARK MODE DASHBOARD TEST');
    console.log('========================================\n');

    const timestamp = Date.now();
    const testEmail = `dark-mode-${timestamp}@crit-fumble.test`;
    const testUsername = `dark_mode_${timestamp}`;
    const randomCoins = Math.floor(Math.random() * 300) + 1;

    await test.step('Create session and set Crit-Coins balance', async () => {
      await page.goto('http://localhost:3000');

      const authData = await page.evaluate(async ({ email, username, coins }) => {
        const res = await fetch('/api/test-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            username,
            critCoins: coins
          }),
        });
        return res.json();
      }, { email: testEmail, username: testUsername, coins: randomCoins });

      console.log('✅ Session created with Crit-Coins:', randomCoins);
      expect(authData.success).toBe(true);
    });

    await test.step('Verify dashboard in dark mode', async () => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Ensure dark mode (add dark class to html element)
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await page.waitForTimeout(500);

      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      expect(currentUrl).toContain('/dashboard');

      // Check if Crit-Coins balance is visible in header
      const coinsBalance = page.locator('header').getByText(randomCoins.toLocaleString());
      await expect(coinsBalance).toBeVisible();

      console.log('✅ Dashboard displayed in dark mode with Crit-Coins in header');
      console.log('');
    });

    console.log('========================================');
    console.log('DARK MODE TEST COMPLETED');
    console.log('========================================\n');
  });
});
