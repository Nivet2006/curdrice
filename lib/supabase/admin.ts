import { createClient } from '@supabase/supabase-js'

// Fail fast: if required env vars are absent, crash immediately at startup
// rather than silently connecting to placeholder credentials.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing required env var: NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseServiceKey) {
  throw new Error('Missing required env var: SUPABASE_SERVICE_ROLE_KEY')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

