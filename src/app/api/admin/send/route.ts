import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendSMS } from '@/lib/twilio'
import { rateLimit } from '@/lib/rate-limit'

const BATCH_SIZE = 40      // recipients per API call (keeps execution under 60s on Vercel free)
const SEND_DELAY_MS = 200  // ms between sends (respects 1 MPS toll-free carrier limit)

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function maskPhone(p: string) {
  return p.replace(/(\+?\d+)(\d{4})$/, (_, prefix, last4) => '*'.repeat(prefix.length) + last4)
}

// POST /api/admin/send — send a one-off message in batches to avoid Vercel timeout
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = rateLimit(`admin-send:${ip}`, 10, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many sends. Please wait before sending again.' },
      { status: 429 }
    )
  }

  let body: { message?: string; target?: string; offset?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { message, target, offset = 0 } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }
  if (!target) {
    return NextResponse.json({ error: 'Target (all or event ID) is required' }, { status: 400 })
  }

  // Build opt-out exclusion set
  const { data: optOuts } = await supabase().from('opt_outs').select('phone')
  const optOutSet = new Set((optOuts ?? []).map((o) => o.phone))

  // Get full recipient phone list (deduplicated, opt-outs removed)
  let allPhones: string[]

  if (target === 'all') {
    const { data: rsvps } = await supabase().from('rsvps').select('phone')
    const unique = [...new Set((rsvps ?? []).map((r) => r.phone))]
    allPhones = unique.filter((p) => !optOutSet.has(p))
  } else if (target.startsWith('series:')) {
    const seriesName = target.slice(7)
    const { data: rsvpData } = await supabase()
      .from('rsvps')
      .select('phone, events!inner(series)')
      .filter('events.series', 'eq', seriesName)
    const unique = [...new Set((rsvpData ?? []).map((r: { phone: string }) => r.phone))]
    allPhones = unique.filter((p) => !optOutSet.has(p))
  } else {
    const { data: rsvps } = await supabase()
      .from('rsvps')
      .select('phone')
      .eq('event_id', target)
    allPhones = (rsvps ?? []).map((r) => r.phone).filter((p) => !optOutSet.has(p))
  }

  const grandTotal = allPhones.length

  if (grandTotal === 0) {
    return NextResponse.json({ sent: 0, batchSent: 0, grandTotal: 0, nextOffset: null, phones: [], errors: [] })
  }

  // Slice the batch for this request
  const batch = allPhones.slice(offset, offset + BATCH_SIZE)
  const nextOffset = offset + BATCH_SIZE < grandTotal ? offset + BATCH_SIZE : null

  const trimmedMessage = message.trim()
  let sent = 0
  const errors: string[] = []
  const sentPhones: string[] = []

  for (const phone of batch) {
    try {
      await sendSMS(phone, trimmedMessage)
      sent++
      sentPhones.push(maskPhone(phone))
    } catch (err) {
      errors.push((err as Error).message?.slice(0, 80) ?? 'Unknown error')
    }
    if (batch.indexOf(phone) < batch.length - 1) {
      await sleep(SEND_DELAY_MS)
    }
  }

  return NextResponse.json({
    sent,           // sent in this batch
    batchSent: sent,
    grandTotal,     // total eligible recipients across all batches
    nextOffset,     // null = all done; number = call again with this offset
    phones: sentPhones, // masked phones sent in this batch
    errors: errors.slice(0, 5),
  })
}
