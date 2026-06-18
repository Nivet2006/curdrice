import { createBrowserClient } from '@supabase/ssr'

/**
 * Singleton browser Supabase client.
 * This module is evaluated once per browser session — import `supabase` directly
 * instead of calling createClient() inside components, which would create a new
 * instance on every render and cause subscription churn / extra fetches.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

/** @deprecated Use the `supabase` singleton export directly. */
export function createClient() {
  return supabase
}
