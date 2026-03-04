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

export async function sendSMS(to: string, body: string): Promise<void> {
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!from) throw new Error('Missing TWILIO_PHONE_NUMBER env var')
  await client().messages.create({ body, from, to })
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
