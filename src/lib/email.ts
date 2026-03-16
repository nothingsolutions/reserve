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
  const adminUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/admin`
    : 'https://reservenothing.vercel.app/admin'

  if (!to) {
    console.warn('NOTIFY_EMAIL not set — skipping RSVP notification email')
    return
  }

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#000;color:#fff;border-radius:8px;">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin:0 0 8px;">Nothing Radio</p>
      <h1 style="font-size:20px;font-weight:600;margin:0 0 24px;">New RSVP</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:10px 0;color:#888;width:90px;border-bottom:1px solid #222;">Event</td>
          <td style="padding:10px 0;color:#fff;border-bottom:1px solid #222;">${eventName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;border-bottom:1px solid #222;">Source</td>
          <td style="padding:10px 0;color:#fff;border-bottom:1px solid #222;">${source === 'sms' ? 'SMS (text opt-in)' : 'Web form'}</td>
        </tr>
      </table>
      <div style="margin-top:28px;">
        <a href="${adminUrl}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:12px 24px;border-radius:100px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">View in Admin</a>
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
