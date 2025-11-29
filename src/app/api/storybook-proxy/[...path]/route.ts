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
    // Render login page - redirect to main site's auth
    const callbackUrl = encodeURIComponent(request.url)
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Sign In - Crit-Fumble Component Library</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
              color: #e2e8f0;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 400px;
            }
            .logo {
              font-size: 3rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #a78bfa;
              font-size: 1.75rem;
              margin-bottom: 0.5rem;
            }
            p {
              color: #94a3b8;
              margin-bottom: 2rem;
              line-height: 1.6;
            }
            .login-btn {
              display: inline-flex;
              align-items: center;
              gap: 0.75rem;
              background: #5865F2;
              color: white;
              text-decoration: none;
              padding: 0.875rem 1.5rem;
              border-radius: 0.5rem;
              font-weight: 500;
              font-size: 1rem;
              transition: all 0.2s;
            }
            .login-btn:hover {
              background: #4752c4;
              transform: translateY(-1px);
            }
            .login-btn svg {
              width: 1.25rem;
              height: 1.25rem;
            }
            .footer {
              margin-top: 2rem;
              font-size: 0.875rem;
              color: #64748b;
            }
            .footer a {
              color: #a78bfa;
              text-decoration: none;
            }
            .footer a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">📚</div>
            <h1>Component Library</h1>
            <p>Sign in with Discord to access the Crit-Fumble component library. Admin or owner permissions required.</p>
            <a href="https://crit-fumble.com/api/auth/signin?callbackUrl=${callbackUrl}" class="login-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Sign in with Discord
            </a>
            <div class="footer">
              <a href="https://crit-fumble.com">← Back to Crit-Fumble</a>
            </div>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
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
