import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'
import { normalizePhone } from '../route'

// PATCH /api/rsvp/name — update name on an existing RSVP (called after the phone step succeeds)
export async function PATCH(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, retryAfter } = rateLimit(`rsvp-name:${ip}`, 10, 10 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  let body: { phone?: string; eventId?: string; name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { phone, eventId, name } = body

  if (!phone || !eventId || !name?.trim()) {
    return NextResponse.json({ error: 'phone, eventId and name are required.' }, { status: 400 })
  }

  const normalized = normalizePhone(phone.trim())
  if (!normalized) {
    return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 })
  }

  const { error } = await supabase()
    .from('rsvps')
    .update({ name: name.trim().slice(0, 100) })
    .eq('event_id', eventId)
    .eq('phone', normalized)

  if (error) {
    console.error('Name update failed:', error.code)
    return NextResponse.json({ error: 'Could not save name. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok' })
}
