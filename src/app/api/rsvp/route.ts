import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendSMS } from '@/lib/twilio'
import { rateLimit } from '@/lib/rate-limit'

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`
  return null
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, retryAfter } = rateLimit(`rsvp:${ip}`, 5, 10 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  let body: { name?: string; phone?: string; eventId?: string; consented?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, phone, eventId, consented } = body

  // name is now optional — phone, eventId, and consent are required
  if (!phone?.trim() || !eventId || !consented) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  const normalizedPhone = normalizePhone(phone.trim())
  if (!normalizedPhone) {
    return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 })
  }

  const trimmedName = (name ?? '').trim().slice(0, 100)

  // Fetch event details (needed for SMS copy)
  const { data: event, error: eventError } = await supabase()
    .from('events')
    .select('id, name, date')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  // Check for existing RSVP for this event (idempotent — don't double-register)
  const { data: existing } = await supabase()
    .from('rsvps')
    .select('id')
    .eq('event_id', eventId)
    .eq('phone', normalizedPhone)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ status: 'already_registered' })
  }

  // Store the RSVP
  const { error: insertError } = await supabase().from('rsvps').insert({
    event_id: eventId,
    phone: normalizedPhone,
    name: trimmedName,
    consented_at: new Date().toISOString(),
  })

  if (insertError) {
    console.error('RSVP insert failed:', insertError.code)
    return NextResponse.json({ error: 'Could not save your RSVP. Please try again.' }, { status: 500 })
  }

  // Check if this phone has a non-empty name on any other event (returning attendee)
  // Only the boolean is returned — the name itself is never sent to the client.
  const { data: prior } = await supabase()
    .from('rsvps')
    .select('id')
    .eq('phone', normalizedPhone)
    .neq('event_id', eventId)
    .not('name', 'eq', '')
    .limit(1)
    .maybeSingle()

  const returning = !!prior

  // Send confirmation SMS (non-fatal if it fails — RSVP is already stored)
  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const smsBody = `You're confirmed for ${event.name} on ${eventDate}. See you there! Reply STOP to opt out.`

  try {
    await sendSMS(normalizedPhone, smsBody)
  } catch (err) {
    console.error('Confirmation SMS failed:', (err as Error).message?.slice(0, 80))
  }

  return NextResponse.json({ status: 'confirmed', returning })
}
