import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Public route — returns only non-sensitive event fields (no attendee data)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabase()
    .from('events')
    .select('id, name, date, description, flyer_url')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
