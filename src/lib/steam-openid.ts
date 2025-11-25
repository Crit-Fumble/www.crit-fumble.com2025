/**
 * Steam OpenID 2.0 Authentication
 *
 * Steam uses the deprecated OpenID 2.0 protocol (not OpenID Connect/OAuth 2.0)
 * This implementation provides Steam authentication for NextAuth.js
 *
 * Documentation:
 * - https://steamcommunity.com/dev
 * - https://developer.valvesoftware.com/wiki/Steam_Web_API#OpenID
 * - https://partner.steamgames.com/doc/features/auth
 */

/**
 * Steam OpenID 2.0 endpoints
 */
export const STEAM_OPENID = {
  provider: 'https://steamcommunity.com/openid',
  loginUrl: 'https://steamcommunity.com/openid/login',
  namespace: 'http://specs.openid.net/auth/2.0',
  identifierSelect: 'http://specs.openid.net/auth/2.0/identifier_select',
}

/**
 * Extract SteamID from OpenID claimed_id
 * Format: https://steamcommunity.com/openid/id/<steamid64>
 */
export function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/)
  return match ? match[1] : null
}

/**
 * Build Steam OpenID authentication URL
 */
export function buildSteamOpenIdUrl(returnUrl: string): string {
  const params = new URLSearchParams({
    'openid.ns': STEAM_OPENID.namespace,
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': new URL(returnUrl).origin,
    'openid.identity': STEAM_OPENID.identifierSelect,
    'openid.claimed_id': STEAM_OPENID.identifierSelect,
  })

  return `${STEAM_OPENID.loginUrl}?${params.toString()}`
}

/**
 * Verify Steam OpenID response
 */
export async function verifySteamOpenIdResponse(
  params: Record<string, string>
): Promise<{ verified: boolean; steamId: string | null }> {
  // Change mode to check_authentication for verification
  const verifyParams = new URLSearchParams({
    ...params,
    'openid.mode': 'check_authentication',
  })

  try {
    const response = await fetch(STEAM_OPENID.loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    })

    const text = await response.text()
    const isValid = text.includes('is_valid:true')

    if (isValid && params['openid.claimed_id']) {
      const steamId = extractSteamId(params['openid.claimed_id'])
      return { verified: true, steamId }
    }

    return { verified: false, steamId: null }
  } catch (error) {
    console.error('Steam OpenID verification error:', error)
    return { verified: false, steamId: null }
  }
}

/**
 * Steam Web API - Get Player Summaries
 * Requires STEAM_API_KEY environment variable
 *
 * @see https://developer.valvesoftware.com/wiki/Steam_Web_API#GetPlayerSummaries_.28v0002.29
 */
export interface SteamPlayerSummary {
  steamid: string
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
  personastate: number
  communityvisibilitystate: number
  profilestate: number
  lastlogoff?: number
  commentpermission?: number
  realname?: string
  primaryclanid?: string
  timecreated?: number
  loccountrycode?: string
}

export async function getSteamPlayerSummary(
  steamId: string,
  apiKey: string
): Promise<SteamPlayerSummary | null> {
  try {
    const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('steamids', steamId)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.response?.players?.length > 0) {
      return data.response.players[0]
    }

    return null
  } catch (error) {
    console.error('Steam API error:', error)
    return null
  }
}

/**
 * Steam Web API - Get Owned Games
 * Requires STEAM_API_KEY environment variable
 *
 * @see https://developer.valvesoftware.com/wiki/Steam_Web_API#GetOwnedGames_.28v0001.29
 */
export interface SteamOwnedGame {
  appid: number
  name: string
  playtime_forever: number // minutes
  playtime_windows_forever: number
  playtime_mac_forever: number
  playtime_linux_forever: number
  playtime_deck_forever: number
  rtime_last_played: number // unix timestamp
  playtime_disconnected: number
  img_icon_url: string
  has_community_visible_stats?: boolean
  playtime_2weeks?: number // Optional: playtime in last 2 weeks
}

export async function getSteamOwnedGames(
  steamId: string,
  apiKey: string,
  includeAppInfo = true,
  includePlayedFreeGames = false
): Promise<SteamOwnedGame[] | null> {
  try {
    const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('steamid', steamId)
    url.searchParams.set('format', 'json')
    url.searchParams.set('include_appinfo', includeAppInfo ? '1' : '0')
    url.searchParams.set('include_played_free_games', includePlayedFreeGames ? '1' : '0')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.response?.games) {
      return data.response.games
    }

    return null
  } catch (error) {
    console.error('Steam API error:', error)
    return null
  }
}
