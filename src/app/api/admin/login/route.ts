import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? ''
  const input = body.password ?? ''

  // Always run timingSafeEqual with same-length buffers to avoid timing attacks
  const inputBuf = Buffer.alloc(Math.max(input.length, adminPassword.length), 0)
  const adminBuf = Buffer.alloc(Math.max(input.length, adminPassword.length), 0)
  Buffer.from(input).copy(inputBuf)
  Buffer.from(adminPassword).copy(adminBuf)

  const match = timingSafeEqual(inputBuf, adminBuf) && input.length === adminPassword.length

  if (!match) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = createSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return res
}
