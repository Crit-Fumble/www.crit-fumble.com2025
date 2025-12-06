import { NextRequest, NextResponse } from 'next/server'

const FUMBLEBOT_API_BASE = process.env.FUMBLEBOT_API_URL || 'http://159.203.126.144'

/**
 * Proxy requests to FumbleBot API on DigitalOcean
 *
 * Flow:
 * 1. User visits fumblebot.crit-fumble.com
 * 2. Proxy rewrites to /api/fumblebot-proxy via proxy.ts
 * 3. Request is forwarded to the FumbleBot service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToFumbleBot(request, pathStr, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToFumbleBot(request, pathStr, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToFumbleBot(request, pathStr, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToFumbleBot(request, pathStr, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathStr = path?.join('/') || ''

  return proxyToFumbleBot(request, pathStr, 'PATCH')
}

/**
 * Proxy the request to FumbleBot API
 */
async function proxyToFumbleBot(
  request: NextRequest,
  pathStr: string,
  method: string
): Promise<NextResponse> {
  // Build target URL with query params
  const targetUrl = new URL(pathStr || '/', FUMBLEBOT_API_BASE)
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  try {
    // Build headers to forward
    const headers: Record<string, string> = {
      'Accept': request.headers.get('Accept') || 'application/json',
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

    // Forward CORS headers if present
    const corsHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
    ]
    for (const header of corsHeaders) {
      const value = response.headers.get(header)
      if (value) {
        responseHeaders[header] = value
      }
    }

    return new NextResponse(body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('FumbleBot proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy error' },
      { status: 502 }
    )
  }
}
