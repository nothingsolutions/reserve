import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DEFAULT_SMS_CONFIRM_TEMPLATE } from '@/lib/sms-confirmation-template'

const MAX_TEMPLATE_LEN = 640

export async function GET() {
  const { data, error } = await supabase()
    .from('app_settings')
    .select('sms_confirm_template')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }

  return NextResponse.json({
    template: data?.sms_confirm_template ?? null,
    default: DEFAULT_SMS_CONFIRM_TEMPLATE,
  })
}

export async function POST(req: NextRequest) {
  let body: { template?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const raw = body.template

  // null or empty string = revert to built-in default
  const value = raw === null || raw === undefined || raw === '' ? null : String(raw).trim()

  if (value !== null && value.length > MAX_TEMPLATE_LEN) {
    return NextResponse.json(
      { error: `Template must be ${MAX_TEMPLATE_LEN} characters or fewer` },
      { status: 400 }
    )
  }

  const { error } = await supabase()
    .from('app_settings')
    .upsert({ id: 1, sms_confirm_template: value, updated_at: new Date().toISOString() }, { onConflict: 'id' })

  if (error) {
    console.error('app_settings upsert:', error.code, error.message?.slice(0, 120))
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, template: value })
}
