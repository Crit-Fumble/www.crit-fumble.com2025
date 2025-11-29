/**
 * Auth-Protected Proxy Utilities
 *
 * Utilities for creating authenticated proxy routes that forward
 * requests to external services while protecting them behind auth.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Configuration for an auth-protected proxy
 */
export interface AuthProxyConfig {
  /**
   * Base URL of the target service
   */
  targetBaseUrl: string

  /**
   * Headers to add to proxied requests
   */
  headers?: Record<string, string>

  /**
   * Cache control header value
   * @default 'public, max-age=60'
   */
  cacheControl?: string
}

/**
 * Create an auth-protected proxy handler
 * Forwards requests to a target URL after authentication
 *
 * @example
 * const proxy = createAuthProxy({
 *   targetBaseUrl: 'https://api.example.com',
 *   headers: { 'X-API-Key': process.env.API_KEY },
 * })
 *
 * export async function GET(request: NextRequest, { params }) {
 *   const session = await auth()
 *   if (!session) return proxy.unauthorized()
 *   return proxy.forward(request, params.path)
 * }
 */
export function createAuthProxy(config: AuthProxyConfig) {
  const {
    targetBaseUrl,
    headers: extraHeaders = {},
    cacheControl = 'public, max-age=60',
  } = config

  /**
   * Forward a request to the target service
   *
   * @param request - The incoming request
   * @param path - Path segments to append to base URL
   */
  async function forward(
    request: NextRequest,
    path?: string | string[]
  ): Promise<NextResponse> {
    const pathStr = Array.isArray(path) ? path.join('/') : path || ''
    const targetUrl = pathStr
      ? `${targetBaseUrl}/${pathStr}`
      : `${targetBaseUrl}/`

    try {
      const response = await fetch(targetUrl, {
        headers: {
          Accept: request.headers.get('Accept') || '*/*',
          'Accept-Encoding': request.headers.get('Accept-Encoding') || 'gzip, deflate',
          ...extraHeaders,
        },
      })

      if (!response.ok) {
        // Try index.html for directory paths
        if (response.status === 404 && !pathStr.includes('.')) {
          const indexUrl = `${targetBaseUrl}/${pathStr}/index.html`.replace(/\/+/g, '/')
          const indexResponse = await fetch(indexUrl, {
            headers: extraHeaders,
          })
          if (indexResponse.ok) {
            const body = await indexResponse.arrayBuffer()
            return new NextResponse(body, {
              status: 200,
              headers: {
                'Content-Type': indexResponse.headers.get('Content-Type') || 'text/html',
                'Cache-Control': cacheControl,
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
          'Cache-Control': cacheControl,
        },
      })
    } catch (error) {
      console.error('Proxy error:', error)
      return new NextResponse('Proxy error', { status: 500 })
    }
  }

  /**
   * Return an unauthorized response
   * Redirects to login or returns 401
   *
   * @param request - The incoming request (for callback URL)
   * @param loginUrl - URL to redirect to for login
   */
  function unauthorized(request?: NextRequest, loginUrl?: string): NextResponse {
    if (request && loginUrl) {
      const url = new URL(loginUrl, request.url)
      url.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(url)
    }

    return new NextResponse('Unauthorized', { status: 401 })
  }

  /**
   * Return a forbidden response (authenticated but not authorized)
   *
   * @param message - Custom message to display
   */
  function forbidden(message: string = 'Access denied'): NextResponse {
    return new NextResponse(message, { status: 403 })
  }

  return {
    forward,
    unauthorized,
    forbidden,
    targetBaseUrl,
  }
}

/**
 * Create an HTML login page response
 *
 * @param config - Page configuration
 */
export interface LoginPageConfig {
  /**
   * Page title
   */
  title: string

  /**
   * Heading text
   */
  heading: string

  /**
   * Description text
   */
  description: string

  /**
   * Login button text
   */
  buttonText: string

  /**
   * URL to redirect to for login (with callbackUrl appended)
   */
  loginUrl: string

  /**
   * Callback URL for after login
   */
  callbackUrl: string

  /**
   * Optional back link URL
   */
  backUrl?: string

  /**
   * Optional back link text
   */
  backText?: string
}

export function createLoginPage(config: LoginPageConfig): NextResponse {
  const {
    title,
    heading,
    description,
    buttonText,
    loginUrl,
    callbackUrl,
    backUrl,
    backText,
  } = config

  const fullLoginUrl = `${loginUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`

  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
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
      <h1>${heading}</h1>
      <p>${description}</p>
      <a href="${fullLoginUrl}" class="login-btn">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
        ${buttonText}
      </a>
      ${backUrl ? `<div class="footer"><a href="${backUrl}">${backText || '← Back'}</a></div>` : ''}
    </div>
  </body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

/**
 * Create an access denied page response
 *
 * @param config - Page configuration
 */
export interface AccessDeniedConfig {
  /**
   * Error message to display
   */
  message?: string

  /**
   * URL to redirect back to
   */
  backUrl?: string

  /**
   * Back link text
   */
  backText?: string
}

export function createAccessDeniedPage(config: AccessDeniedConfig = {}): NextResponse {
  const {
    message = 'You need admin or owner permissions to access this resource.',
    backUrl = '/',
    backText = 'Back to Home',
  } = config

  const html = `<!DOCTYPE html>
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
      <p>${message}</p>
      <a href="${backUrl}">${backText}</a>
    </div>
  </body>
</html>`

  return new NextResponse(html, {
    status: 403,
    headers: { 'Content-Type': 'text/html' },
  })
}
