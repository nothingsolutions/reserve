import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateTwilioSignature } from '@/lib/twilio'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return raw
}

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'])

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
  const messageBody = (params['Body'] ?? '').trim().toUpperCase()

  if (STOP_KEYWORDS.has(messageBody)) {
    const phone = normalizePhone(from)
    await supabase()
      .from('opt_outs')
      .upsert({ phone }, { onConflict: 'phone', ignoreDuplicates: true })
  }

  // Return empty TwiML — Twilio expects an XML response
  return new NextResponse('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
