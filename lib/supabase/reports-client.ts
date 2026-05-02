import { createClient } from '@supabase/supabase-js'

// Connects to the SEPARATE reports Supabase project
// Uses service role key — server-side ONLY, never expose to client
const supabaseUrl = process.env.LOGS_SUPABASE_URL || ''
const supabaseKey = process.env.LOGS_SUPABASE_SERVICE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('[reportsClient] LOGS_SUPABASE_URL or LOGS_SUPABASE_SERVICE_KEY is not set.')
}

export const reportsClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
