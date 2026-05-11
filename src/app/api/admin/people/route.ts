import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type EventEntry = { id: string; name: string; date: string }

type PersonResponse = {
  name: string
  phone: string
  events: EventEntry[]
  first_seen: string
  welcome_sent_at: string | null
  unsubscribed: boolean
}

// GET /api/admin/people — paginated subscriber list with event history and opt-out status.
// Query params: page (default 1), limit (default 50, max 100), search (name or phone)
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const search = params.get('search')?.trim() ?? ''
  const page = Math.max(1, parseInt(params.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') ?? '50')))
  const offset = (page - 1) * limit

  // Count total subscribers (for pagination)
  let countQuery = supabase()
    .from('subscribers')
    .select('phone', { count: 'exact', head: true })

  if (search) {
    countQuery = countQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 })
  }

  // Fetch the current page of subscribers
  let subQuery = supabase()
    .from('subscribers')
    .select('phone, name, created_at, welcome_sent_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    subQuery = subQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data: subscribers, error: subError } = await subQuery

  if (subError) {
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 })
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ people: [], total: count ?? 0, page, limit })
  }

  // Fetch all rsvps for this page of subscribers to build event lists
  const phones = subscribers.map((s) => s.phone)

  const { data: rsvps } = await supabase()
    .from('rsvps')
    .select('phone, event_id, events(id, name, date)')
    .in('phone', phones)

  // Build a map of phone → events
  const eventMap = new Map<string, EventEntry[]>()
  for (const rsvp of rsvps ?? []) {
    const rawEvent = rsvp.events
    const event = Array.isArray(rawEvent)
      ? (rawEvent[0] as EventEntry | undefined) ?? null
      : (rawEvent as unknown as EventEntry | null)
    if (!event) continue

    const list = eventMap.get(rsvp.phone) ?? []
    list.push(event)
    eventMap.set(rsvp.phone, list)
  }

  // Fetch opt-out status for this page
  const { data: optOutRows } = await supabase()
    .from('opt_outs')
    .select('phone')
    .in('phone', phones)

  const optOutSet = new Set((optOutRows ?? []).map((o) => o.phone))

  const people: PersonResponse[] = subscribers.map((s) => ({
    name: s.name,
    phone: s.phone,
    events: eventMap.get(s.phone) ?? [],
    first_seen: s.created_at,
    welcome_sent_at: s.welcome_sent_at ?? null,
    unsubscribed: optOutSet.has(s.phone),
  }))

  return NextResponse.json({ people, total: count ?? 0, page, limit })
}
