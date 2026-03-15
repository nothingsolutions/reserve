import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateTwilioSignature } from '@/lib/twilio'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return raw
}

function twimlReply(message: string): NextResponse {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/xml' } })
}

function twimlEmpty(): NextResponse {
  return new NextResponse('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } })
}

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'])
const START_KEYWORDS = new Set(['START', 'UNSTOP', 'YES'])

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Parse URL-encoded Twilio payload
  const params: Record<string, string> = {}
  for (const pair of rawBody.split('&')) {
    const eqIdx = pair.indexOf('=')
    if (eqIdx === -1) continue
    const k = decodeURIComponent(pair.slice(0, eqIdx).replace(/\+/g, ' '))
    const v = decodeURIComponent(pair.slice(eqIdx + 1).replace(/\+/g, ' '))
    params[k] = v
  }

  // Validate signature in production to prevent forged requests
  if (process.env.NODE_ENV === 'production') {
    const signature = req.headers.get('x-twilio-signature') ?? ''
    const appUrl = process.env.APP_URL ?? ''
    const webhookUrl = `${appUrl}/api/twilio/webhook`
    if (!validateTwilioSignature(signature, webhookUrl, params)) {
      return new NextResponse('<Response></Response>', {
        status: 403,
        headers: { 'Content-Type': 'text/xml' },
      })
    }
  }

  const from = params['From'] ?? ''
  const phone = normalizePhone(from)
  const messageBody = (params['Body'] ?? '').trim().toUpperCase()

  // ── STOP: add to opt-outs ─────────────────────────────────────────────────
  if (STOP_KEYWORDS.has(messageBody)) {
    await supabase()
      .from('opt_outs')
      .upsert({ phone }, { onConflict: 'phone', ignoreDuplicates: true })
    return twimlEmpty()
  }

  // ── START: remove from opt-outs ───────────────────────────────────────────
  if (START_KEYWORDS.has(messageBody)) {
    await supabase().from('opt_outs').delete().eq('phone', phone)
    return twimlEmpty()
  }

  // ── RADIO: auto-RSVP to next upcoming event ───────────────────────────────
  if (messageBody === 'RADIO') {
    // Check if opted out
    const { data: optOut } = await supabase()
      .from('opt_outs')
      .select('phone')
      .eq('phone', phone)
      .maybeSingle()

    if (optOut) {
      return twimlReply("Nothing Radio: You're currently opted out. Text START to re-subscribe.")
    }

    // Find next upcoming event
    const { data: nextEvent } = await supabase()
      .from('events')
      .select('id, name, date')
      .gt('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!nextEvent) {
      return twimlReply('Nothing Radio: No events scheduled yet — stay tuned! Reply STOP to opt out.')
    }

    const eventDate = new Date(nextEvent.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })

    // Check if already RSVP'd
    const { data: existing } = await supabase()
      .from('rsvps')
      .select('id')
      .eq('event_id', nextEvent.id)
      .eq('phone', phone)
      .maybeSingle()

    if (existing) {
      return twimlReply(
        `Nothing Radio: You're already confirmed for ${nextEvent.name} on ${eventDate}. See you there!`
      )
    }

    // Insert RSVP
    await supabase().from('rsvps').insert({
      event_id: nextEvent.id,
      phone,
      name: '',
      consented_at: new Date().toISOString(),
    })

    return twimlReply(
      `Nothing Radio: You're confirmed for ${nextEvent.name} on ${eventDate}. See you there! Reply STOP to opt out.`
    )
  }

  // All other messages — no response
  return twimlEmpty()
}
