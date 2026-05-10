import { supabase } from '@/lib/supabase'

export const DEFAULT_SMS_CONFIRM_TEMPLATE =
  "Nothing Radio: You're confirmed for {eventName} on {eventDate}. See you there! Reply STOP to opt out."

export function interpolateSmsTemplate(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, val)
  }
  return out
}

export async function getSmsTemplate(): Promise<string> {
  try {
    const { data } = await supabase()
      .from('app_settings')
      .select('sms_confirm_template')
      .eq('id', 1)
      .maybeSingle()

    const override = data?.sms_confirm_template?.trim()
    return override || DEFAULT_SMS_CONFIRM_TEMPLATE
  } catch {
    return DEFAULT_SMS_CONFIRM_TEMPLATE
  }
}
