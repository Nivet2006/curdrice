import { createClient } from '@supabase/supabase-js'

// This client connects to the SEPARATE logs-only Supabase project (or schema)
// Uses service role — server-side only, never expose to client
export const logsClient = createClient(
  process.env.LOGS_SUPABASE_URL!,
  process.env.LOGS_SUPABASE_SERVICE_KEY!
)
