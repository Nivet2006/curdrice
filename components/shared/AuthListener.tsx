'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clearSessionAndRedirect } from '@/lib/auth-guard'

export function AuthListener() {
  useEffect(() => {
    const supabase = createClient()
    
    // On mount: validate session exists, clear stale tokens if not
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // No valid session — purge stale localStorage
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }
    })

    // Listen to auth events — react, don't poll
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // If the page is currently showing a logout loader, let it finish its animation and handle redirect
          const hasShieldLoader = typeof document !== 'undefined' && !!document.body.innerText.includes('Signing you out');
          if (hasShieldLoader) {
            return
          }
          await clearSessionAndRedirect(true)
        }

        if (event === 'TOKEN_REFRESHED' && !session) {
          // Refreshed but got no session back — treat as signed out
          await clearSessionAndRedirect(true)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return null
}
export default AuthListener
