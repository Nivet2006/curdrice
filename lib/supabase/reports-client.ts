import { createClient } from '@supabase/supabase-js'

// Connects to the SEPARATE reports Supabase project
// Uses service role key — server-side ONLY, never expose to client
const supabaseUrl = process.env.LOGS_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.LOGS_SUPABASE_SERVICE_KEY || 'placeholder'

if (!process.env.LOGS_SUPABASE_URL || !process.env.LOGS_SUPABASE_SERVICE_KEY) {
  console.warn('[reportsClient] LOGS_SUPABASE_URL or LOGS_SUPABASE_SERVICE_KEY is not set.')
}

export const reportsClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
