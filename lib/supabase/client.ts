import { createBrowserClient } from '@supabase/ssr'

// Warn loudly if browser env vars are missing.
// We cannot throw here (would break SSR/hydration), but the error will
// appear in both server logs and browser devtools console.
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error(
    '[Supabase] Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'The app will fail to connect to Supabase. Check your .env.local file.'
  )
}

/**
 * Singleton browser Supabase client.
 * This module is evaluated once per browser session — import `supabase` directly
 * instead of calling createClient() inside components, which would create a new
 * instance on every render and cause subscription churn / extra fetches.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/** @deprecated Use the `supabase` singleton export directly. */
export function createClient() {
  return supabase
}
