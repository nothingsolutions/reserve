import { createHmac, timingSafeEqual } from 'crypto'

export const SESSION_COOKIE = 'admin_session'
const SESSION_VALUE = 'admin-authenticated'

function getSecret(): string {
  const s = process.env.ADMIN_SECRET
  if (!s) throw new Error('Missing ADMIN_SECRET env var')
  return s
}

export function createSessionToken(): string {
  const hmac = createHmac('sha256', getSecret())
  hmac.update(SESSION_VALUE)
  const sig = hmac.digest('hex')
  return `${SESSION_VALUE}.${sig}`
}

export function verifySessionToken(token: string): boolean {
  if (!token) return false
  try {
    const expected = createSessionToken()
    if (token.length !== expected.length) return false
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
