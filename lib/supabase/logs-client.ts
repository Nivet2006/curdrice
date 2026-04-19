import { createClient } from '@supabase/supabase-js'

// This client connects to the SEPARATE logs-only Supabase project (or schema)
// Uses service role — server-side only, never expose to client
const supabaseUrl = process.env.LOGS_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.LOGS_SUPABASE_SERVICE_KEY || 'placeholder'

export const logsClient = createClient(supabaseUrl, supabaseKey)
