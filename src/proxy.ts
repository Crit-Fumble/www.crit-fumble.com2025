import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Pages that require authentication
const protectedRoutes = [
  '/dashboard',
  '/account',
  '/admin',
  '/worlds',
  '/universes',
  '/vtt-platforms',
  '/rpg-systems',
  '/core-concepts',
  '/characters',
  '/campaigns',
  // Add other protected routes here
]

// Pages that are public and don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/api',
  '/_next',
  '/img',
  '/favicon.ico',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip proxy for public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    const session = await auth()

    // Not logged in - redirect to login
    if (!session?.user) {
      const url = new URL('/login', request.url)
      return NextResponse.redirect(url)
    }

    // Check profile completion from session (set during login)
    // This avoids an extra DB query on every request
    const profileCompleted = (session.user as any).profileCompleted

    if (profileCompleted === false && pathname !== '/signup') {
      const url = new URL('/signup', request.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|img|public).*)',
  ],
}
