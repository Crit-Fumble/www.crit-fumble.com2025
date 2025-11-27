# Core Concepts Resilience

## Overview

The Core Concepts RPG database is an **optional dependency**. The main website will function normally even when the Core Concepts database is unavailable.

## Architecture

### Database Independence

- **Main Website DB (Neon)**: Essential for site operation
  - User accounts
  - Payments
  - Core website features

- **Core Concepts DB (DigitalOcean)**: Optional RPG features
  - RPG data (campaigns, worlds, characters)
  - Game sessions
  - Independent player system

### Graceful Degradation

When Core Concepts is unavailable:
- ✅ Main website loads normally
- ✅ User authentication works
- ✅ Non-RPG features function
- ⚠️ RPG API returns 503 with clear error message
- ⚠️ RPG features show "temporarily unavailable"

## Implementation

### Database Client

The Core Concepts client ([src/lib/db/core-concepts.ts](../src/lib/db/core-concepts.ts)) includes:

```typescript
// Returns null if database unavailable
export const prismaConcepts: PrismaClient | null

// Boolean flag for availability check
export const coreConceptsAvailable: boolean

// Safe query wrapper
export async function safeCoreConceptsQuery<T>(
  queryFn: () => Promise<T>
): Promise<T | null>
```

### RPG Route Protection

Use the middleware helper ([src/lib/rpg-middleware.ts](../src/lib/rpg-middleware.ts)):

```typescript
import { withCoreConceptsCheck } from '@/lib/rpg-middleware'

// Automatically returns 503 if unavailable
export const GET = withCoreConceptsCheck(async (request) => {
  // prismaConcepts is guaranteed available here
  const data = await prismaConcepts.rpgCampaign.findMany()
  return NextResponse.json({ data })
})
```

Or check manually:

```typescript
import { prismaConcepts, coreConceptsAvailable } from '@/lib/db'

if (!prismaConcepts || !coreConceptsAvailable) {
  return NextResponse.json(
    { error: 'RPG features temporarily unavailable' },
    { status: 503 }
  )
}
```

## Configuration

### Environment Variables

Core Concepts database URL is optional:

```env
# Optional - if not set, RPG features will be unavailable
CORE_CONCEPTS_DATABASE_URL=postgresql://...
```

### Behavior Without URL

If `CORE_CONCEPTS_DATABASE_URL` is not set:
- Website starts successfully
- `coreConceptsAvailable` = `false`
- `prismaConcepts` = `null`
- Console shows: "Core Concepts database URL not configured"
- RPG routes return 503

## Error Handling

### Connection Failures

If database URL is set but connection fails:
- Error logged to console
- `coreConceptsAvailable` set to `false`
- Website continues to function
- RPG features gracefully degrade

### Query Failures

Use `safeCoreConceptsQuery` for safe operations:

```typescript
import { safeCoreConceptsQuery } from '@/lib/db'

const campaigns = await safeCoreConceptsQuery(() =>
  prismaConcepts!.rpgCampaign.findMany()
)

if (!campaigns) {
  // Handle unavailable or failed query
  return showErrorMessage()
}
```

## Testing Resilience

### Test Without Database

1. Comment out `CORE_CONCEPTS_DATABASE_URL` in `.env`
2. Start application: `npm run dev`
3. Verify:
   - ✅ Website loads
   - ✅ Authentication works
   - ✅ RPG routes return 503

### Test With Connection Failure

1. Set invalid `CORE_CONCEPTS_DATABASE_URL`
2. Start application
3. Verify graceful degradation

### Test Database Downtime

1. Stop Core Concepts database
2. Application continues running
3. RPG queries fail gracefully

## Monitoring

### Health Checks

Check Core Concepts availability:

```typescript
import { coreConceptsAvailable } from '@/lib/db'

console.log('Core Concepts:', coreConceptsAvailable ? 'Available' : 'Unavailable')
```

### API Status Endpoint

RPG routes return `503 Service Unavailable` when Core Concepts is down:

```json
{
  "error": "Core Concepts RPG features are temporarily unavailable",
  "message": "The RPG database is currently offline. Please try again later."
}
```

## Best Practices

### DO ✅

- Check `coreConceptsAvailable` before queries
- Use `withCoreConceptsCheck` middleware
- Return clear 503 errors
- Log database unavailability
- Continue website operation

### DON'T ❌

- Crash website if Core Concepts unavailable
- Show cryptic errors to users
- Retry failed connections in hot paths
- Block main database operations

## Future Enhancements

- [ ] Redis caching for Core Concepts data
- [ ] Automatic reconnection with exponential backoff
- [ ] Dashboard showing Core Concepts status
- [ ] Metrics for uptime/downtime
- [ ] Offline mode with cached data

---

**Last Updated**: 2025-11-27
**Status**: Implemented
