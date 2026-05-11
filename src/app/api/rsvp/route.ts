import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendSMS, sendMessage } from '@/lib/twilio'
import { rateLimit } from '@/lib/rate-limit'
import { notifyNewRsvp } from '@/lib/email'
import { getSmsTemplate, interpolateSmsTemplate } from '@/lib/sms-confirmation-template'
import { formatEventDateLong } from '@/lib/eventTimezone'
import {
  upsertSubscriber,
  isFirstSubscriber,
  getWelcomeSettings,
  buildWelcomeBody,
  markWelcomeSent,
  getVCardUrl,
} from '@/lib/welcome-vcard'

export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('11')) digits = digits.slice(1)
  if (digits.length === 10) {
    // NANP area codes must start with 2–9; 0 and 1 are never valid first digits.
    if (digits[0] === '0' || digits[0] === '1') return null
    return `+1${digits}`
  }
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

  // Ensure subscriber row exists (non-fatal — RSVP is already stored)
  await upsertSubscriber(normalizedPhone, trimmedName)

  const eventDate = formatEventDateLong(event.date)
  const templateVars = { eventName: event.name, eventDate }

  // Send confirmation / welcome SMS (non-fatal if it fails — RSVP is already stored)
  try {
    const firstTimer = await isFirstSubscriber(normalizedPhone)

    if (firstTimer) {
      const welcome = await getWelcomeSettings()
      if (welcome.enabled) {
        // First-ever subscriber + welcome on: send MMS with vCard attachment
        const body = buildWelcomeBody(welcome.text, templateVars)
        await sendMessage(normalizedPhone, body, [getVCardUrl()])
        await markWelcomeSent(normalizedPhone)
      } else {
        // First-ever subscriber + welcome off: regular confirmation SMS, leave welcome_sent_at NULL
        const tmpl = await getSmsTemplate()
        await sendSMS(normalizedPhone, interpolateSmsTemplate(tmpl, templateVars))
      }
    } else {
      // Returning subscriber: regular confirmation SMS
      const tmpl = await getSmsTemplate()
      await sendSMS(normalizedPhone, interpolateSmsTemplate(tmpl, templateVars))
    }
  } catch (err) {
    console.error('Confirmation SMS failed:', (err as Error).message?.slice(0, 80))
  }

  // Non-blocking notification email — failure does not affect the RSVP response
  notifyNewRsvp({ eventName: event.name, source: 'web' }).catch((err) =>
    console.error('RSVP notification email failed:', (err as Error).message?.slice(0, 120))
  )

  return NextResponse.json({ status: 'confirmed', returning })
}
