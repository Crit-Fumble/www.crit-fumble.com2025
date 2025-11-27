# Security Review - @crit-fumble/foundryvtt-client Package

**Date:** January 26, 2025
**Package:** @crit-fumble/foundryvtt-client
**Status:** NOT IMPLEMENTED - Stub/Placeholder Only

---

## Executive Summary

The foundryvtt-client package is currently a **placeholder with no implementation**. Only package.json and README exist - no source code has been written.

### Security Status: ✅ N/A - NO CODE TO REVIEW

- ✅ No eval() usage (no code exists)
- ✅ No new Function() usage (no code exists)
- ✅ No security vulnerabilities (no code exists)

---

## Package Purpose (Planned)

**@crit-fumble/foundryvtt-client** is intended to provide browser automation utilities for Foundry VTT:
- Playwright/Puppeteer-based testing
- Screenshot generation
- Session recording
- Performance monitoring
- Bot player simulation
- Multi-browser testing

---

## Current Implementation Status

**Files Present:**
- `package.json` (658 bytes) - Package configuration
- `README.md` (2,668 bytes) - API documentation

**Files Missing:**
- No `src/` directory
- No TypeScript source files
- No compiled `dist/` files
- No `tsconfig.json`
- No `API.md` (referenced but not created)

**Git History:**
- Added Nov 19, 2025 and Nov 25, 2025
- Only metadata files committed
- Implementation deferred to future

---

## Planned API (from README)

The README documents intended classes:

```typescript
// FoundryBrowser - Browser automation
connect(url, credentials)
navigateToScene(sceneId)
screenshot(path)
close()

// FoundryTester - UI testing
test(name, testFn)

// FoundryRecorder - Session recording
startRecording(url)
stopRecording(path)
```

---

## Security Recommendations for Future Implementation

When this package is implemented, ensure these security practices:

### 1. Credential Management 🔒

**DO:**
```typescript
// Use environment variables
const url = process.env.FOUNDRY_URL
const username = process.env.FOUNDRY_USERNAME
const password = process.env.FOUNDRY_PASSWORD

// Never log credentials
console.log('Connecting to Foundry...') // ✅ Safe
console.log(`Connecting with password: ${password}`) // ❌ NEVER DO THIS
```

**DON'T:**
- Hard-code credentials
- Log passwords or API keys
- Store credentials in source control
- Pass credentials as URL parameters

### 2. URL Validation 🌐

**Validate all Foundry instance URLs:**
```typescript
function validateFoundryUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Only allow HTTPS in production
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false
    }

    // Whitelist allowed hostnames if needed
    const allowedHosts = process.env.ALLOWED_FOUNDRY_HOSTS?.split(',') || []
    if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
      return false
    }

    return true
  } catch {
    return false
  }
}
```

### 3. File Path Validation 📁

**Sanitize screenshot and recording paths:**
```typescript
import path from 'path'

function validateOutputPath(filePath: string): string {
  // Resolve to absolute path
  const absolute = path.resolve(filePath)

  // Ensure it's within allowed directory
  const allowedDir = path.resolve(process.env.OUTPUT_DIR || './output')

  if (!absolute.startsWith(allowedDir)) {
    throw new Error('Output path must be within allowed directory')
  }

  return absolute
}
```

### 4. Browser Context Isolation 🔒

**Run automation in isolated contexts:**
```typescript
import { chromium } from 'playwright'

async function connect(url: string, credentials: Credentials) {
  // Create isolated browser context
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',  // Only if running in Docker
      '--disable-setuid-sandbox'
    ]
  })

  // Use incognito context
  const context = await browser.newContext({
    ignoreHTTPSErrors: process.env.NODE_ENV === 'development',  // Only in dev
    permissions: []  // No permissions by default
  })

  const page = await context.newPage()

  // Implement timeout
  page.setDefaultTimeout(30000)  // 30 seconds

  return { browser, context, page }
}
```

### 5. Avoid Dynamic Code Execution ⚠️

**DO NOT:**
```typescript
// ❌ NEVER DO THIS
const testCode = request.body.testCode
eval(testCode)  // CRITICAL VULNERABILITY

// ❌ NEVER DO THIS
const scriptUrl = request.body.scriptUrl
await page.addScriptTag({ url: scriptUrl })  // XSS RISK
```

**DO:**
```typescript
// ✅ Use predefined test functions
const tests = {
  'login-test': async (page) => {
    await page.fill('#username', credentials.username)
    await page.fill('#password', credentials.password)
    await page.click('#login-button')
  },
  'scene-navigation-test': async (page) => {
    await page.click('#scene-list')
    await page.click(`[data-scene-id="${sceneId}"]`)
  }
}

// Execute predefined test by name
await tests[testName](page)
```

### 6. Rate Limiting & Resource Management 🚦

**Implement limits:**
```typescript
class FoundryBrowser {
  private maxConcurrentSessions = 5
  private activeSessions = new Set()

  async connect(url: string, credentials: Credentials) {
    if (this.activeSessions.size >= this.maxConcurrentSessions) {
      throw new Error('Maximum concurrent sessions reached')
    }

    const sessionId = crypto.randomUUID()
    this.activeSessions.add(sessionId)

    try {
      // ... connection logic
    } finally {
      this.activeSessions.delete(sessionId)
    }
  }
}
```

### 7. Secure Screenshot Storage 📸

**Sanitize and validate:**
```typescript
async screenshot(options: ScreenshotOptions) {
  // Validate file extension
  const allowedExtensions = ['.png', '.jpg', '.jpeg']
  const ext = path.extname(options.path)

  if (!allowedExtensions.includes(ext)) {
    throw new Error('Invalid file extension')
  }

  // Validate path
  const safePath = validateOutputPath(options.path)

  // Take screenshot
  await this.page.screenshot({ path: safePath })

  // Set proper file permissions (read-only)
  await fs.chmod(safePath, 0o444)
}
```

---

## Dependency Security

The planned dependencies are legitimate but require secure usage:

### Playwright (^1.40.0)
- ✅ Official Microsoft project
- ⚠️ Requires secure configuration (see examples above)
- Keep updated for security patches

### Puppeteer (^21.0.0)
- ✅ Official Google Chrome project
- ⚠️ Similar security considerations as Playwright
- Keep updated for security patches

---

## Testing Security

When implementing tests:

```typescript
// ✅ Good - Isolated test environment
test('login flow', async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Test logic...

  await context.close()
  await browser.close()
})

// ❌ Bad - Shared browser instance
const sharedBrowser = await chromium.launch()  // Global
test('test 1', async () => {
  const page = await sharedBrowser.newPage()  // Shared state!
})
```

---

## Recommendations Summary

| Priority | Recommendation | Reason |
|----------|---------------|--------|
| CRITICAL | No eval() or dynamic code execution | Prevent code injection |
| CRITICAL | Validate all URLs and file paths | Prevent path traversal and SSRF |
| HIGH | Secure credential management | Prevent credential leaks |
| HIGH | Browser context isolation | Prevent session cross-contamination |
| MEDIUM | Rate limiting | Prevent resource exhaustion |
| MEDIUM | Proper error handling | Don't expose sensitive info |

---

## Conclusion

The **@crit-fumble/foundryvtt-client** package currently has **no security issues** because it has no implementation. When implementing:

1. **Follow all recommendations above**
2. **Never use eval() or new Function()**
3. **Validate all inputs (URLs, paths, credentials)**
4. **Isolate browser contexts**
5. **Implement proper error handling**
6. **Add comprehensive security testing**

**Current Status:** ✅ Safe (no code to review)
**When Implemented:** Follow security guidelines above

---

*Review performed by: Claude AI Code Assistant*
*Date: January 26, 2025*
