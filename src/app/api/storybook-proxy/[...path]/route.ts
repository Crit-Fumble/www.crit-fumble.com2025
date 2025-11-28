import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole, canEditWiki } from '@/lib/permissions'

const GITHUB_PAGES_BASE = 'https://crit-fumble.github.io/storybook'

/**
 * Proxy requests to GitHub Pages storybook with auth protection
 * Only admins and owners can access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Check authentication
  const session = await auth()

  if (!session?.user?.id) {
    // Redirect to login
    const loginUrl = new URL('/api/auth/signin', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Check authorization (admin or owner only)
  const { role } = await getUserRole(session.user.id)

  if (!canEditWiki(role)) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Access Denied</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #0f172a;
              color: #e2e8f0;
            }
            .container { text-align: center; }
            h1 { color: #f87171; }
            a {
              color: #a78bfa;
              text-decoration: none;
              display: inline-block;
              margin-top: 1rem;
              padding: 0.5rem 1rem;
              border: 1px solid #a78bfa;
              border-radius: 0.5rem;
            }
            a:hover { background: #a78bfa22; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Access Denied</h1>
            <p>You need admin or owner permissions to view the component library.</p>
            <a href="https://crit-fumble.com/dashboard">Back to Dashboard</a>
          </div>
        </body>
      </html>`,
      {
        status: 403,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }

  // Build the GitHub Pages URL
  const { path } = await params
  const pathStr = path?.join('/') || ''
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
