import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type PersonEntry = {
  name: string
  phone: string
  events: { id: string; name: string; date: string }[]
  first_seen: string
}

// GET /api/admin/people — unique people with all events they've RSVP'd to
export async function GET() {
  const { data: rsvps, error } = await supabase()
    .from('rsvps')
    .select('phone, name, consented_at, created_at, event_id, events(id, name, date)')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 })
  }

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

  const people = Array.from(map.values()).sort(
    (a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime()
  )

  return NextResponse.json(people)
}
