import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parsePickerToUtcIso } from '@/lib/eventTimezone'

// GET /api/admin/events — list all events with RSVP counts and attendee names
export async function GET() {
  const { data: events, error } = await supabase()
    .from('events')
    .select('id, name, date, description, flyer_url, series, created_at')
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }

  const eventsWithRSVPs = await Promise.all(
    (events ?? []).map(async (event) => {
      const { data: rsvps } = await supabase()
        .from('rsvps')
        .select('id, name, phone, created_at')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true })

      return {
        ...event,
        series: event.series ?? null,
        rsvp_count: rsvps?.length ?? 0,
        attendees: rsvps ?? [],
      }
    })
  )

  return NextResponse.json(eventsWithRSVPs)
}

// POST /api/admin/events — create a new event
export async function POST(req: NextRequest) {
  let body: { name?: string; date?: string; description?: string; flyer_url?: string; series?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, date, description, flyer_url, series } = body
  if (!name?.trim() || !date) {
    return NextResponse.json({ error: 'Name and date are required' }, { status: 400 })
  }

  // Normalize: if the client sent a naive picker string (no offset/Z), treat it
  // as America/New_York and convert to UTC. If it already has an offset, use as-is.
  const isNaive = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(date)
  const utcDate = isNaive ? parsePickerToUtcIso(date) : date
  if (!utcDate) {
    return NextResponse.json({ error: 'Invalid date value' }, { status: 400 })
  }

  const { data, error } = await supabase()
    .from('events')
    .insert({
      name: name.trim().slice(0, 200),
      date: utcDate,
      description: description?.trim().slice(0, 500) ?? null,
      flyer_url: flyer_url?.trim() ?? null,
      series: series?.trim().slice(0, 100) ?? null,
    })
    .select('id, name, date, description, flyer_url, series, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
