import { supabase } from '@/lib/supabase'
import { interpolateSmsTemplate } from '@/lib/sms-confirmation-template'

export const DEFAULT_WELCOME_MESSAGE =
  "Welcome to Nothing Radio. You're confirmed for {eventName} on {eventDate}. Save this number to stay in the loop. Reply STOP to opt out."

// Public HTTPS URL Twilio fetches when attaching the contact card to welcome MMS.
// Prefer VCARD_URL when the file is hosted elsewhere (e.g. Squarespace at nothingradio.com/s/...).
// Otherwise falls back to APP_URL + /nothing-radio.vcf (the file in public/).
export function getVCardUrl(): string {
  const explicit = process.env.VCARD_URL?.trim()
  if (explicit) {
    if (!explicit.startsWith('https://')) {
      throw new Error('VCARD_URL must be an https:// URL (Twilio requirement for MMS media)')
    }
    return explicit.replace(/\/$/, '')
  }
  const base = process.env.APP_URL
  if (!base) throw new Error('Set VCARD_URL or APP_URL — required for vCard MMS media URL')
  return `${base.replace(/\/$/, '')}/nothing-radio.vcf`
}

// Ensures a subscriber row exists for this phone.
// - If no row exists: inserts with the provided name and current timestamp.
// - If a row exists: updates name only when the stored name is blank and a non-blank name is given.
//   Never overwrites a good name, and never changes created_at or welcome_sent_at.
export async function upsertSubscriber(phone: string, name: string): Promise<void> {
  // Step 1: insert if not exists (ON CONFLICT DO NOTHING preserves created_at and welcome_sent_at)
  const { error: insertError } = await supabase()
    .from('subscribers')
    .upsert(
      { phone, name: name.trim() || '', created_at: new Date().toISOString() },
      { onConflict: 'phone', ignoreDuplicates: true }
    )

  if (insertError) {
    console.error('upsertSubscriber insert failed:', insertError.code, insertError.message?.slice(0, 120))
    return
  }

  // Step 2: if a non-blank name was provided, fill it in only when the stored name is currently blank
  if (name.trim()) {
    await supabase()
      .from('subscribers')
      .update({ name: name.trim() })
      .eq('phone', phone)
      .eq('name', '')
  }
}

// Marks the welcome card as sent for this phone number.
export async function markWelcomeSent(phone: string): Promise<void> {
  const { error } = await supabase()
    .from('subscribers')
    .update({ welcome_sent_at: new Date().toISOString() })
    .eq('phone', phone)

  if (error) {
    console.error('markWelcomeSent failed:', error.code, error.message?.slice(0, 120))
  }
}

// Returns true if this phone has never received the welcome card.
// True when: no subscriber row exists yet, OR welcome_sent_at IS NULL.
export async function isFirstSubscriber(phone: string): Promise<boolean> {
  const { data, error } = await supabase()
    .from('subscribers')
    .select('welcome_sent_at')
    .eq('phone', phone)
    .maybeSingle()

  if (error) {
    console.error('isFirstSubscriber query failed:', error.code, error.message?.slice(0, 120))
    return false
  }

  // No row yet (upsert hasn't run) or card not sent
  return data === null || data.welcome_sent_at === null
}

export type WelcomeSettings = {
  enabled: boolean
  text: string
}

// Reads welcome_enabled + welcome_message_text from app_settings.
// Falls back to defaults if the row doesn't exist or columns are null.
export async function getWelcomeSettings(): Promise<WelcomeSettings> {
  try {
    const { data } = await supabase()
      .from('app_settings')
      .select('welcome_enabled, welcome_message_text')
      .eq('id', 1)
      .maybeSingle()

    return {
      enabled: data?.welcome_enabled ?? false,
      text: data?.welcome_message_text?.trim() || DEFAULT_WELCOME_MESSAGE,
    }
  } catch {
    return { enabled: false, text: DEFAULT_WELCOME_MESSAGE }
  }
}

// Interpolates the welcome message text with event variables.
// Reuses the same interpolation logic as the confirmation template.
export function buildWelcomeBody(
  text: string,
  vars: { eventName: string; eventDate: string }
): string {
  return interpolateSmsTemplate(text, vars)
}
