import { NextRequest, NextResponse } from 'next/server'
import { verifyStorybookToken } from '@/lib/storybook-token'
import { canEditWiki } from '@/lib/permissions'

const GITHUB_PAGES_BASE = 'https://crit-fumble.github.io/storybook'
const COOKIE_NAME = '_sb_access'
const COOKIE_MAX_AGE = 24 * 60 * 60 // 24 hours (matches token expiry)

/**
 * Proxy requests to GitHub Pages storybook with token-based auth protection
 * Only admins and owners can access
 *
 * Authentication flow:
 * 1. User visits storybook.crit-fumble.com
 * 2. Proxy rewrites to /api/storybook-proxy via proxy.ts
 * 3. If token in query params, validate and set cookie, then redirect to clean URL
 * 4. If cookie exists, validate token and serve storybook
 * 5. If no valid token, redirect to www.crit-fumble.com/storybook-auth
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  // Check for token in query params (redirect from storybook-auth page)
  const tokenFromQuery = request.nextUrl.searchParams.get('_sb_token')

  if (tokenFromQuery) {
    // Validate the token
    const tokenData = verifyStorybookToken(tokenFromQuery)

    if (tokenData && canEditWiki(tokenData.role)) {
      // Token is valid - set cookie and redirect to clean URL
      const cleanUrl = new URL(request.url)
      cleanUrl.searchParams.delete('_sb_token')

      const response = NextResponse.redirect(cleanUrl)
      response.cookies.set(COOKIE_NAME, tokenFromQuery, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      })

      return response
    }

    // Invalid token in query - redirect to auth
    return redirectToAuth(request, pathStr)
  }

  // Check for existing cookie
  const tokenFromCookie = request.cookies.get(COOKIE_NAME)?.value

  if (tokenFromCookie) {
    const tokenData = verifyStorybookToken(tokenFromCookie)

    if (tokenData && canEditWiki(tokenData.role)) {
      // Valid token - serve storybook content
      return proxyToStorybook(request, pathStr)
    }

    // Invalid or expired cookie - clear it and redirect to auth
    const response = redirectToAuth(request, pathStr)
    response.cookies.delete(COOKIE_NAME)
    return response
  }

  // No token - redirect to auth
  return redirectToAuth(request, pathStr)
}

/**
 * Redirect to storybook-auth page on main domain
 */
function redirectToAuth(request: NextRequest, pathStr: string): NextResponse {
  // Build the storybook URL for redirect after auth
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'storybook.crit-fumble.com'
  const storybookUrl = `https://${host}/${pathStr}`

  const authUrl = new URL('https://www.crit-fumble.com/storybook-auth')
  authUrl.searchParams.set('redirect', storybookUrl)

  return NextResponse.redirect(authUrl)
}

/**
 * Proxy the request to GitHub Pages storybook
 */
async function proxyToStorybook(request: NextRequest, pathStr: string): Promise<NextResponse> {
  const targetUrl = pathStr ? `${GITHUB_PAGES_BASE}/${pathStr}` : `${GITHUB_PAGES_BASE}/`

  try {
    // Fetch from GitHub Pages
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': request.headers.get('Accept') || '*/*',
        'Accept-Encoding': request.headers.get('Accept-Encoding') || 'gzip, deflate',
      },
    })

    if (!response.ok) {
      // Try index.html for directory paths
      if (response.status === 404 && !pathStr.includes('.')) {
        const indexUrl = `${GITHUB_PAGES_BASE}/${pathStr}/index.html`.replace(/\/+/g, '/')
        const indexResponse = await fetch(indexUrl)
        if (indexResponse.ok) {
          const body = await indexResponse.arrayBuffer()
          return new NextResponse(body, {
            status: 200,
            headers: {
              'Content-Type': indexResponse.headers.get('Content-Type') || 'text/html',
              'Cache-Control': 'public, max-age=60',
            },
          })
        }
      }

      return new NextResponse(`Not found: ${pathStr}`, { status: 404 })
    }

    const body = await response.arrayBuffer()
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (error) {
    console.error('Storybook proxy error:', error)
    return new NextResponse('Proxy error', { status: 500 })
  }
}
