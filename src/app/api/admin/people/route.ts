import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type PersonEntry = {
  name: string
  phone: string
  events: { id: string; name: string; date: string }[]
  first_seen: string
}

type PersonResponse = PersonEntry & { unsubscribed: boolean }

// GET /api/admin/people — unique people with all events they've RSVP'd to
// Query params: page (default 1), limit (default 50, max 100), search (name or phone)
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const search = params.get('search')?.trim() ?? ''
  const page = Math.max(1, parseInt(params.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') ?? '50')))

  let query = supabase()
    .from('rsvps')
    .select('phone, name, consented_at, created_at, event_id, events(id, name, date)')
    .order('created_at', { ascending: true })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data: rsvps, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 })
  }

  const { data: optOutRows } = await supabase().from('opt_outs').select('phone')
  const optOutSet = new Set((optOutRows ?? []).map((o) => o.phone))

  const map = new Map<string, PersonEntry>()

  for (const rsvp of rsvps ?? []) {
    // Supabase may type the join as array; handle both shapes
    const rawEvent = rsvp.events
    const event = Array.isArray(rawEvent)
      ? (rawEvent[0] as { id: string; name: string; date: string } | undefined) ?? null
      : (rawEvent as unknown as { id: string; name: string; date: string } | null)
    if (!event) continue

    const existing = map.get(rsvp.phone)
    if (existing) {
      existing.events.push(event)
    } else {
      map.set(rsvp.phone, {
        name: rsvp.name,
        phone: rsvp.phone,
        events: [event],
        first_seen: rsvp.created_at,
      })
    }
  }

  const allPeople: PersonResponse[] = Array.from(map.values())
    .map((p) => ({ ...p, unsubscribed: optOutSet.has(p.phone) }))
    .sort((a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime())

  const total = allPeople.length
  const paged = allPeople.slice((page - 1) * limit, page * limit)

  return NextResponse.json({ people: paged, total, page, limit })
}
