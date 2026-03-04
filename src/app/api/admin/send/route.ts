import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendSMS } from '@/lib/twilio'
import { rateLimit } from '@/lib/rate-limit'

// POST /api/admin/send — send a one-off message to All or a specific event's RSVPs
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = rateLimit(`admin-send:${ip}`, 10, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many sends. Please wait before sending again.' },
      { status: 429 }
    )
  }

  let body: { message?: string; target?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { message, target } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }
  if (!target) {
    return NextResponse.json({ error: 'Target (all or event ID) is required' }, { status: 400 })
  }

  // Build opt-out exclusion set
  const { data: optOuts } = await supabase().from('opt_outs').select('phone')
  const optOutSet = new Set((optOuts ?? []).map((o) => o.phone))

  // Get recipient phones
  let phones: string[]

  if (target === 'all') {
    const { data: rsvps } = await supabase().from('rsvps').select('phone')
    const unique = [...new Set((rsvps ?? []).map((r) => r.phone))]
    phones = unique.filter((p) => !optOutSet.has(p))
  } else {
    // Specific event ID
    const { data: rsvps } = await supabase()
      .from('rsvps')
      .select('phone')
      .eq('event_id', target)
    phones = (rsvps ?? []).map((r) => r.phone).filter((p) => !optOutSet.has(p))
  }

  if (phones.length === 0) {
    return NextResponse.json({ sent: 0, total: 0, message: 'No eligible recipients.' })
  }

  const trimmedMessage = message.trim()
  let sent = 0
  const errors: string[] = []

  for (const phone of phones) {
    try {
      await sendSMS(phone, trimmedMessage)
      sent++
    } catch (err) {
      errors.push((err as Error).message?.slice(0, 80) ?? 'Unknown error')
    }
  }

  return NextResponse.json({ sent, total: phones.length, errors: errors.slice(0, 5) })
}
