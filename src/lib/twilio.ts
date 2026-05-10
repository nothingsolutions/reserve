import twilio from 'twilio'

// Server-side only. Never expose these to the client.
function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) {
    throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN env vars')
  }
  return twilio(sid, token)
}

let _client: ReturnType<typeof getClient> | null = null

function client() {
  if (!_client) _client = getClient()
  return _client
}

function normalizeToE164(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('11')) digits = digits.slice(1)
  if (digits.length === 10) digits = '1' + digits
  return '+' + digits
}

export async function sendSMS(to: string, body: string): Promise<void> {
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!from) throw new Error('Missing TWILIO_PHONE_NUMBER env var')
  await client().messages.create({ body, from, to: normalizeToE164(to) })
}

// Sends an SMS or MMS depending on whether mediaUrls are provided.
// When mediaUrls is non-empty the message becomes an MMS (Twilio fetches each URL at send time).
// body may be empty for image-only sends but most carriers render better with at least a short caption.
export async function sendMessage(
  to: string,
  body: string,
  mediaUrls?: string[],
): Promise<void> {
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!from) throw new Error('Missing TWILIO_PHONE_NUMBER env var')
  const normalized = normalizeToE164(to)
  if (mediaUrls && mediaUrls.length > 0) {
    await client().messages.create({ body, from, to: normalized, mediaUrl: mediaUrls })
  } else {
    await client().messages.create({ body, from, to: normalized })
  }
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!token) throw new Error('Missing TWILIO_AUTH_TOKEN env var')
  return twilio.validateRequest(token, signature, url, params)
}
