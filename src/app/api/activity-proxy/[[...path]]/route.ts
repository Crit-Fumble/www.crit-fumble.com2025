import { NextRequest, NextResponse } from 'next/server'

const CORE_API_URL = process.env.CORE_API_URL || 'https://core.crit-fumble.com'

/**
 * Proxy requests to Core API for Discord Activity
 *
 * Flow:
 * 1. Discord embeds activity at *.discordsays.com or activity.crit-fumble.com
 * 2. Proxy rewrites to /api/activity-proxy via proxy.ts
 * 3. Request is forwarded to Core's /activity/* endpoints
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToCore(request, pathStr, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToCore(request, pathStr, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToCore(request, pathStr, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToCore(request, pathStr, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToCore(request, pathStr, 'PATCH')
}

/**
 * Proxy the request to Core API activity endpoints
 */
async function proxyToCore(
  request: NextRequest,
  pathStr: string,
  method: string
): Promise<NextResponse> {
  // Build target URL - prepend /activity to the path
  const targetUrl = new URL(`/activity/${pathStr}`, CORE_API_URL)
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  try {
    // Build headers to forward
    const headers: Record<string, string> = {
      'Accept': request.headers.get('Accept') || '*/*',
      'Accept-Encoding': request.headers.get('Accept-Encoding') || 'gzip, deflate',
    }

    // Forward content-type for body requests
    const contentType = request.headers.get('Content-Type')
    if (contentType) {
      headers['Content-Type'] = contentType
    }

    // Forward authorization if present
    const authorization = request.headers.get('Authorization')
    if (authorization) {
      headers['Authorization'] = authorization
    }

    // Forward cookies (important for session auth)
    const cookie = request.headers.get('Cookie')
    if (cookie) {
      headers['Cookie'] = cookie
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    // Include body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.text()
        if (body) {
          fetchOptions.body = body
        }
      } catch {
        // No body to forward
      }
    }

    const response = await fetch(targetUrl.toString(), fetchOptions)

    // Get response body
    const body = await response.arrayBuffer()
    const responseContentType = response.headers.get('Content-Type') || 'application/octet-stream'

    // Forward response headers we care about
    const responseHeaders: Record<string, string> = {
      'Content-Type': responseContentType,
    }

    // Forward cache headers for static assets
    const cacheControl = response.headers.get('Cache-Control')
    if (cacheControl) {
      responseHeaders['Cache-Control'] = cacheControl
    }

    // Forward CORS headers if present
    const corsHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Credentials',
    ]
    for (const header of corsHeaders) {
      const value = response.headers.get(header)
      if (value) {
        responseHeaders[header] = value
      }
    }

    // Forward set-cookie headers (important for auth)
    const setCookie = response.headers.get('Set-Cookie')
    if (setCookie) {
      responseHeaders['Set-Cookie'] = setCookie
    }

    return new NextResponse(body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Activity proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy error' },
      { status: 502 }
    )
  }
}

/**
 * Handle OPTIONS for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  })
}
