import { Resend } from 'resend'

// Server-side only — never import in client components.
function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Missing RESEND_API_KEY env var')
  return new Resend(key)
}

let _resend: ReturnType<typeof getResend> | null = null
function resend() {
  if (!_resend) _resend = getResend()
  return _resend
}

export async function notifyNewRsvp({
  eventName,
  source,
}: {
  eventName: string
  source: 'web' | 'sms'
}): Promise<void> {
  const to = process.env.NOTIFY_EMAIL
  const from = process.env.NOTIFY_FROM_EMAIL ?? 'Nothing Radio RSVPs <onboarding@resend.dev>'
  const adminUrl =
    process.env.NOTIFY_ADMIN_URL?.trim() ||
    (process.env.APP_URL ? `${process.env.APP_URL}/admin` : 'https://reservenothing.vercel.app/admin')

  if (!to) {
    console.warn('NOTIFY_EMAIL not set — skipping RSVP notification email')
    return
  }

  // Light background + dark text so it stays readable in dark-mode email clients
  const safeEventName = eventName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const sourceLabel = source === 'sms' ? 'SMS (text opt-in)' : 'Web form'
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;color:#111111;border-radius:8px;color-scheme:light;">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#555555;margin:0 0 8px;">Nothing Radio</p>
      <h1 style="font-size:20px;font-weight:600;margin:0 0 24px;color:#111111;">New RSVP</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:10px 0;color:#555555;width:90px;border-bottom:1px solid #e0e0e0;">Event</td>
          <td style="padding:10px 0;color:#111111;border-bottom:1px solid #e0e0e0;">${safeEventName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#555555;border-bottom:1px solid #e0e0e0;">Source</td>
          <td style="padding:10px 0;color:#111111;border-bottom:1px solid #e0e0e0;">${sourceLabel}</td>
        </tr>
      </table>
      <div style="margin-top:28px;">
        <a href="${adminUrl}" style="display:inline-block;background:#111111;color:#ffffff !important;text-decoration:none;padding:12px 24px;border-radius:100px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">View in Admin</a>
      </div>
    </div>
  `

  const text = `New RSVP\n\nEvent: ${eventName}\nSource: ${source === 'sms' ? 'SMS (text opt-in)' : 'Web form'}\n\nView in admin: ${adminUrl}`

  await resend().emails.send({
    from,
    to,
    subject: `New RSVP: ${eventName}`,
    html,
    text,
  })
}
