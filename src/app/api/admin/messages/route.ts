import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/admin/messages — list broadcast history, newest first
export async function GET() {
  const { data, error } = await supabase()
    .from('broadcast_log')
    .select('id, body, media_urls, target, recipient_count, sent_at')
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch message history' }, { status: 500 })
  }

  // Resolve event names for rows where target is an event UUID
  const eventIds = (data ?? [])
    .map((row) => row.target)
    .filter((t) => /^[0-9a-f-]{36}$/i.test(t))

  let eventNames: Record<string, string> = {}
  if (eventIds.length > 0) {
    const { data: events } = await supabase()
      .from('events')
      .select('id, name')
      .in('id', eventIds)
    eventNames = Object.fromEntries((events ?? []).map((e) => [e.id, e.name]))
  }

  const rows = (data ?? []).map((row) => ({
    ...row,
    target_label: resolveTargetLabel(row.target, eventNames),
  }))

  return NextResponse.json(rows)
}

// POST /api/admin/messages — log a completed broadcast
export async function POST(req: NextRequest) {
  let body: { body?: string; mediaUrls?: string[]; target?: string; recipientCount?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { body: msgBody, mediaUrls, target, recipientCount } = body

  if (!msgBody?.trim() && (!Array.isArray(mediaUrls) || mediaUrls.length === 0)) {
    return NextResponse.json({ error: 'body or mediaUrls required' }, { status: 400 })
  }
  if (!target) {
    return NextResponse.json({ error: 'target required' }, { status: 400 })
  }

  const { error } = await supabase().from('broadcast_log').insert({
    body: (msgBody ?? '').trim(),
    media_urls: Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls : null,
    target,
    recipient_count: recipientCount ?? 0,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to save log entry' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

function resolveTargetLabel(target: string, eventNames: Record<string, string>): string {
  if (target === 'all') return 'Everyone'
  if (target.startsWith('series:')) return `${target.slice(7)} series`
  return eventNames[target] ?? target
}
