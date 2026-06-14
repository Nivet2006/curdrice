import { createClient } from './supabase/client'

const supabase = createClient()
let isRefreshing = false

export async function safeRefreshSession(): Promise<boolean> {
  // Guard against concurrent/infinite refresh loops
  if (isRefreshing) return false
  isRefreshing = true

  try {
    const { error } = await supabase.auth.refreshSession()

    if (error) {
      // On invalid token, sign out and clear state
      if (
        error.status === 400 ||
        error.code === 'refresh_token_not_found'
      ) {
        await clearSessionAndRedirect()
        return false
      }
    }

    return true
  } finally {
    isRefreshing = false
  }
}

export async function clearSessionAndRedirect() {
  try {
    await supabase.auth.signOut()
  } catch (_) {
    // signOut itself may fail if token is gone — that's fine
  }

  // Clear any persisted auth state
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key)
      }
    })
    window.location.href = '/login'
  }
}
