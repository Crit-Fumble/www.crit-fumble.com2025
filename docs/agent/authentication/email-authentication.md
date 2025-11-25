# Email Authentication Implementation Guide

This document provides a comprehensive guide for implementing email (magic link) authentication for Crit-Fumble Gaming.

## Current Status

Email authentication is **stubbed out** in the codebase for future implementation. The OAuth providers (Discord, GitHub, Twitch) are currently the only active authentication methods.

**Note**: SMS authentication was considered but rejected due to high cost ($0.05 per verification). Email authentication via Resend is much more cost-effective with a free tier of 100 emails/day.

## Email Authentication (Magic Link)

### Overview
- **Provider**: Resend (https://resend.com)
- **Method**: Passwordless magic link sent to email
- **Cost**: Free tier: 100 emails/day, $20/month for 50,000 emails
- **Files Modified**:
  - [src/packages/cfg-lib/auth.ts](../../src/packages/cfg-lib/auth.ts#L18-L31)
  - [src/app/login/page.tsx](../../src/app/login/page.tsx#L69-L111)

### Implementation Steps

1. **Sign up for Resend**
   - Go to https://resend.com
   - Create an account
   - Get your API key from https://resend.com/api-keys

2. **Verify Your Domain** (for production)
   - Add DNS records to verify `crit-fumble.com`
   - Follow Resend's domain verification instructions
   - This allows you to send emails from `noreply@crit-fumble.com`

3. **Update Environment Variables**
   ```bash
   # .env.development.local
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="noreply@crit-fumble.com"

   # .env.production (via Vercel)
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="noreply@crit-fumble.com"
   ```

4. **Enable in Code**

   In [src/packages/cfg-lib/auth.ts](../../src/packages/cfg-lib/auth.ts):
   ```typescript
   // Uncomment these lines (currently lines 28-31)
   Resend({
     apiKey: process.env.RESEND_API_KEY!,
     from: process.env.RESEND_FROM_EMAIL || "noreply@crit-fumble.com",
   }),
   ```

5. **Enable in Login UI**

   In [src/app/login/page.tsx](../../src/app/login/page.tsx):
   ```typescript
   // Uncomment the email form and divider (currently lines 69-111)
   ```

6. **Test**
   - Navigate to `/login`
   - Enter an email address
   - Check inbox for magic link
   - Click link to authenticate

### Customizing Email Template

Resend allows custom email templates. To customize:

1. Create a React Email template in `src/emails/magic-link.tsx`
2. Import and use in the Resend provider configuration
3. See: https://react.email/docs/introduction

## Security Considerations

### Rate Limiting
Email authentication should be rate-limited to prevent abuse:

1. **Install rate limiting middleware**
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. **Implement in API routes**
   ```typescript
   import { Ratelimit } from "@upstash/ratelimit"
   import { Redis } from "@upstash/redis"

   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
   })

   // In your auth endpoint
   const { success } = await ratelimit.limit(ipAddress)
   if (!success) {
     return new Response("Too many requests", { status: 429 })
   }
   ```

### Email Validation
Validate email addresses before sending magic links:

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  throw new Error('Invalid email address')
}
```

## Testing

### Email Testing (Development)
1. Use a service like [Mailtrap](https://mailtrap.io) for development
2. Or use your personal email for testing
3. Resend provides a test mode with 100 free emails/day

## Cost Estimation

### Email (Resend)
- **Development**: Free (100 emails/day)
- **Production**:
  - Small site (<50k emails/month): Free
  - Medium site (<500k emails/month): $20/month
  - Large site: Custom pricing

### Typical Usage Scenarios
Assuming 20% of users use email login:
- 100 daily logins = 20 emails = Free
- 1,000 daily logins = 200 emails = Free (within 100/day limit, spread across month)
- 10,000 daily logins = 2,000 emails = $20/month

## Rollout Strategy

1. **Phase 1**: Enable email authentication
   - Lower cost than SMS
   - Easier to implement
   - Test with beta users
   - Monitor usage and costs

2. **Phase 2**: Make email/OAuth equal options
   - Users can link multiple auth methods
   - Better account recovery options
   - Provide flexibility for users who prefer different login methods

## Why Not SMS?

SMS authentication was explored but rejected for the following reasons:

### Cost Analysis
- **Twilio Verify**: $0.05 per verification
- **Example monthly costs**:
  - 100 logins = $5/month
  - 1,000 logins = $50/month
  - 10,000 logins = $500/month

### Comparison with Email
| Metric | Email (Resend) | SMS (Twilio) |
|--------|----------------|--------------|
| Cost per verification | $0 (free tier) | $0.05 |
| 1,000 monthly verifications | Free | $50 |
| 10,000 monthly verifications | $20 | $500 |
| User experience | Click link in email | Enter 6-digit code |
| Implementation complexity | Low | Medium (2-step flow) |

### Decision
Email authentication provides:
- **Much lower cost** (free for most use cases)
- **Simpler UX** (one-click vs typing code)
- **Easier implementation** (no 2-step flow needed)
- **Better for desktop users** (email easier to access than phone)

For a TTRPG community where most users are on desktop computers, email is the superior choice.

## Support and Documentation

- **Resend Docs**: https://resend.com/docs
- **NextAuth.js Email Provider**: https://next-auth.js.org/providers/email
- **React Email**: https://react.email (for custom templates)

## Questions?

If you have questions about implementing email authentication, refer to:
- This document
- Code comments in [src/packages/cfg-lib/auth.ts](../../src/packages/cfg-lib/auth.ts)
- Code comments in [src/app/login/page.tsx](../../src/app/login/page.tsx)
