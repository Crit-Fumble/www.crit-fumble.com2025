/**
 * FOUNDRY VTT API INTEGRATION - STUBBED
 *
 * Helper library for integrating with Foundry VTT via REST API modules.
 *
 * Supported Modules:
 * - PlaneShift: Full-featured module with Discord/OIDC auth
 * - Foundry REST API: Simpler relay architecture
 * - Custom modules: User's own Foundry API plugin
 *
 * Requirements:
 * - User must have Foundry VTT server running (local or cloud)
 * - User must install a REST API module in Foundry
 * - User must generate API key in module settings
 * - Server must have API_KEY_ENCRYPTION_SECRET for encrypting stored keys
 *
 * API Key Security:
 * - API keys are encrypted before storage using AES-256
 * - Never log or expose API keys in responses
 * - Keys are decrypted only when making requests to Foundry
 * - Users can revoke keys at any time in Foundry settings
 */

import crypto from 'crypto'

export interface FoundryWorld {
  id: string
  title: string
  system: string
  description?: string
  background?: string
  coreVersion?: string
}

export interface FoundryActor {
  id: string
  name: string
  type: string
  img?: string
  data?: any
}

export interface FoundryUser {
  id: string
  name: string
  role: string
  avatar?: string
}

/**
 * Encrypt API key for secure storage
 */
export function encryptApiKey(apiKey: string): string {
  const encryptionSecret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!encryptionSecret) {
    throw new Error('API_KEY_ENCRYPTION_SECRET is not configured')
  }

  const cipher = crypto.createCipher('aes-256-cbc', encryptionSecret)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

/**
 * Decrypt API key for making requests
 */
export function decryptApiKey(encryptedKey: string): string {
  const encryptionSecret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!encryptionSecret) {
    throw new Error('API_KEY_ENCRYPTION_SECRET is not configured')
  }

  const decipher = crypto.createDecipher('aes-256-cbc', encryptionSecret)
  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Test connection to Foundry VTT instance
 */
export async function testFoundryConnection(
  apiUrl: string,
  apiKey: string
): Promise<{ success: boolean; error?: string; version?: string }> {
  try {
    const response = await fetch(`${apiUrl}/api/status`, {
      headers: {
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      version: data.coreVersion,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch user's Foundry VTT worlds
 */
export async function getFoundryWorlds(
  apiUrl: string,
  apiKey: string
): Promise<FoundryWorld[] | null> {
  try {
    const response = await fetch(`${apiUrl}/api/worlds`, {
      headers: {
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch Foundry worlds:', response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Foundry worlds:', error)
    return null
  }
}

/**
 * Fetch actors (characters/NPCs) from a Foundry world
 */
export async function getFoundryActors(
  apiUrl: string,
  apiKey: string,
  worldId: string
): Promise<FoundryActor[] | null> {
  try {
    const response = await fetch(`${apiUrl}/api/worlds/${worldId}/actors`, {
      headers: {
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch Foundry actors:', response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Foundry actors:', error)
    return null
  }
}

/**
 * Fetch user info from Foundry VTT
 */
export async function getFoundryUser(
  apiUrl: string,
  apiKey: string
): Promise<FoundryUser | null> {
  try {
    const response = await fetch(`${apiUrl}/api/user`, {
      headers: {
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch Foundry user:', response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Foundry user:', error)
    return null
  }
}

/**
 * Detect which Foundry REST API module is installed
 */
export async function detectFoundryModule(
  apiUrl: string,
  apiKey: string
): Promise<'planeshift' | 'foundry-rest-api' | 'custom' | 'unknown'> {
  try {
    // Try PlaneShift endpoint
    const planeshiftResponse = await fetch(`${apiUrl}/api/planeshift/info`, {
      headers: { 'X-API-Key': apiKey },
    })
    if (planeshiftResponse.ok) return 'planeshift'

    // Try generic REST API endpoint
    const restResponse = await fetch(`${apiUrl}/api/modules`, {
      headers: { 'X-API-Key': apiKey },
    })
    if (restResponse.ok) {
      const modules = await restResponse.json()
      if (modules.find((m: any) => m.id === 'foundry-rest-api')) {
        return 'foundry-rest-api'
      }
    }

    // If neither matches but connection works, assume custom
    const statusResponse = await fetch(`${apiUrl}/api/status`, {
      headers: { 'X-API-Key': apiKey },
    })
    if (statusResponse.ok) return 'custom'

    return 'unknown'
  } catch (error) {
    console.error('Error detecting Foundry module:', error)
    return 'unknown'
  }
}
