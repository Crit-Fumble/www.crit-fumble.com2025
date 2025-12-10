/**
 * Signin Route Handler
 *
 * Redirects to Core API for OAuth authentication.
 * Core handles Discord OAuth and sets the session cookie.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSigninUrl } from '@/lib/core-auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  // Ensure callback URL is absolute
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.crit-fumble.com'
  const absoluteCallback = callbackUrl.startsWith('http')
    ? callbackUrl
    : `${baseUrl}${callbackUrl.startsWith('/') ? '' : '/'}${callbackUrl}`

  // Redirect to Core's signin
  const signinUrl = getSigninUrl('discord', absoluteCallback)
  return NextResponse.redirect(signinUrl)
}
