import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'admin_session'
const SESSION_VALUE = 'admin-authenticated'
const encoder = new TextEncoder()

// Web Crypto HMAC-SHA256 — compatible with the Node.js crypto version in auth.ts
async function computeExpectedToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(SESSION_VALUE))
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${SESSION_VALUE}.${hex}`
}

async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (!secret || !token) return false
  try {
    const expected = await computeExpectedToken(secret)
    if (token.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < token.length; i++) {
      diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

// Routes that require an admin session
const PROTECTED_ADMIN_ROUTES = [
  '/admin',
  '/api/admin/events',
  '/api/admin/people',
  '/api/admin/send',
  '/api/admin/logout',
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin protection ────────────────────────────────────────────────────────
  const needsAuth =
    PROTECTED_ADMIN_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/')) &&
    !pathname.startsWith('/admin/login') &&
    !pathname.startsWith('/api/admin/login')

  if (needsAuth) {
    const token = req.cookies.get(SESSION_COOKIE)?.value ?? ''
    const valid = await verifyToken(token)
    if (!valid) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── CORS for API routes ──────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin') ?? ''
    const appUrl = process.env.APP_URL ?? ''
    const squarespaceDomain = process.env.SQUARESPACE_DOMAIN ?? ''

    const isAllowed =
      process.env.NODE_ENV !== 'production' ||
      origin === appUrl ||
      origin === squarespaceDomain ||
      origin.endsWith('.squarespace.com') ||
      origin.endsWith('.squarespace.io')

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': isAllowed ? origin : appUrl,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const res = NextResponse.next()
    if (isAllowed && origin) {
      res.headers.set('Access-Control-Allow-Origin', origin)
    }
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
