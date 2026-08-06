import { createClient } from '@supabase/supabase-js'

// Fail fast: if required env vars are absent, crash immediately at startup
// rather than silently connecting to placeholder credentials.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('[Supabase Admin] Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

