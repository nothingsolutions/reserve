import { createClient } from '@supabase/supabase-js'

// Server-side only — uses the service role key.
// Never import this in client components or expose these values to the browser.
function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Lazily-initialized singleton (avoids re-creating on every request in the same process)
let _supabase: ReturnType<typeof getSupabase> | null = null

export function supabase() {
  if (!_supabase) _supabase = getSupabase()
  return _supabase
}
