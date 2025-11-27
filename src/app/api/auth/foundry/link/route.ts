import { NextRequest, NextResponse } from 'next/server'
import { prismaMain } from '@/lib/db'
import { auth } from '@/lib/auth'
import crypto from 'crypto'

/**
 * FOUNDRY VTT API KEY LINKING - STUBBED
 *
 * This endpoint allows users to link their Foundry VTT instance via API key.
 * Setup Required:
 * 1. User must install a Foundry VTT REST API module:
 *    - Option A: PlaneShift (https://foundryvtt.com/packages/planeshift)
 *    - Option B: Foundry REST API (simpler)
 *    - Option C: Your custom Foundry API plugin
 * 2. User generates API key in Foundry module settings
 * 3. Add API_KEY_ENCRYPTION_SECRET to .env:
 *    Generate with: openssl rand -hex 32
 * Request Body:
 * {
 *   "apiUrl": "https://my-foundry.example.com",  // or http://192.168.1.100:30000
 *   "apiKey": "user-generated-api-key",
 * }
 * Process:
 * 1. Validate API key by testing connection to Foundry instance
 * 2. Fetch user's Foundry username and user ID
 * 3. Encrypt API key before storing in database
 * 4. Save to user's CritUser record
 * Response:
 *   "success": true,
 *   "username": "FoundryUsername",
 *   "worldCount": 5
 */
export async function POST(request: NextRequest) {
  // STUBBED - Uncomment to enable
  /*
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { apiUrl, apiKey } = await request.json()
    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'API URL and API key are required' },
        { status: 400 }
      )
    // Validate URL format
    try {
      new URL(apiUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid API URL' }, { status: 400 })
    // Test connection to Foundry instance
    const testResponse = await fetch(`${apiUrl}/api/status`, {
      headers: {
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    if (!testResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to connect to Foundry VTT. Please check your API URL and key.' },
        { status: 401 }
      )
    }

    const foundryData = await testResponse.json()
    // Fetch user info from Foundry
    const userResponse = await fetch(`${apiUrl}/api/user`, {
      headers: {
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user info from Foundry VTT' },
        { status: 401 }
      )
    }

    const userData = await userResponse.json()
    // Encrypt API key before storing
    const encryptionSecret = process.env.API_KEY_ENCRYPTION_SECRET!
    const cipher = crypto.createCipher('aes-256-cbc', encryptionSecret)
    let encryptedKey = cipher.update(apiKey, 'utf8', 'hex')
    encryptedKey += cipher.final('hex')
    // Update user record with Foundry info
    await prismaMain.critUser.update({
      where: { id: session.user.id },
      data: {
        foundryApiUrl: apiUrl,
        foundryApiKey: encryptedKey,
        foundryUsername: userData.name,
        foundryUserId: userData.id,
      },
    })

    return NextResponse.json({
      success: true,
      username: userData.name,
      worldCount: foundryData.worlds?.length || 0,
  } catch (error) {
    console.error('Error linking Foundry VTT account:', error)
    return NextResponse.json(
      { error: 'Failed to link Foundry VTT account' },
      { status: 500 }
    )
  }
  */
  return NextResponse.json(
    {
      error: 'Foundry VTT integration is not yet enabled',
      documentation: '/docs/integrations/INTEGRATION_SUMMARY.md',
      setup: {
        required: [
          '1. Install Foundry VTT REST API module (PlaneShift, Foundry REST API, or custom)',
          '2. Generate API key in Foundry module settings',
          '3. Add API_KEY_ENCRYPTION_SECRET to .env (generate with: openssl rand -hex 32)',
          '4. Uncomment code in this route',
          '5. Add Foundry UI to LinkedAccountsContent.tsx',
        ],
        request: {
          method: 'POST',
          body: {
            apiUrl: 'https://your-foundry.example.com',
            apiKey: 'your-api-key',
          },
        },
      },
    },
    { status: 501 }
  )
}
