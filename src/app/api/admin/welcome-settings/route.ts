import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DEFAULT_WELCOME_MESSAGE } from '@/lib/welcome-vcard'

const MAX_TEXT_LEN = 640

export async function GET() {
  const { data, error } = await supabase()
    .from('app_settings')
    .select('welcome_enabled, welcome_message_text')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }

  return NextResponse.json({
    enabled: data?.welcome_enabled ?? false,
    text: data?.welcome_message_text ?? null,
    default: DEFAULT_WELCOME_MESSAGE,
  })
}

export async function POST(req: NextRequest) {
  let body: { enabled?: boolean; text?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() }

  if (typeof body.enabled === 'boolean') {
    updates.welcome_enabled = body.enabled
  }

  if ('text' in body) {
    const raw = body.text
    const value = raw === null || raw === undefined || raw === '' ? null : String(raw).trim()
    if (value !== null && value.length > MAX_TEXT_LEN) {
      return NextResponse.json(
        { error: `Message must be ${MAX_TEXT_LEN} characters or fewer` },
        { status: 400 }
      )
    }
    updates.welcome_message_text = value
  }

  const { error } = await supabase()
    .from('app_settings')
    .upsert(updates, { onConflict: 'id' })

  if (error) {
    console.error('app_settings upsert (welcome):', error.code, error.message?.slice(0, 120))
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
