/**
 * Signout Route Handler
 *
 * Signs out by calling Core API and clearing the session.
 * Redirects back to homepage or specified callback URL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  // Ensure callback URL is absolute
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.crit-fumble.com'
  const absoluteCallback = callbackUrl.startsWith('http')
    ? callbackUrl
    : `${baseUrl}${callbackUrl.startsWith('/') ? '' : '/'}${callbackUrl}`

  try {
    // Get session cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('authjs.session-token')

    // Call Core API to destroy session
    if (sessionCookie?.value) {
      await fetch(`${CORE_API_URL}/api/auth/signout`, {
        method: 'POST',
        headers: {
          Cookie: `authjs.session-token=${sessionCookie.value}`,
        },
      })
    }
  } catch (error) {
    console.error('[signout] Failed to call Core API:', error)
  }

  // Redirect to callback (Core should have cleared the cookie)
  return NextResponse.redirect(absoluteCallback)
}

export async function POST(request: NextRequest) {
  // Also support POST for form submissions
  return GET(request)
}
