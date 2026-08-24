'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getMaintenanceSettings } from '@/lib/actions/announcements'
import { SystemMaintenanceSettings } from '@/lib/types'
import { Wrench, ShieldAlert, Clock, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// Authentication and public system routes that MUST ALWAYS remain accessible during maintenance
const EXEMPT_AUTH_ROUTES = [
  '/login',
  '/register',
  '/recovery',
  '/auth',
  '/api/auth',
  '/status',
]

export function MaintenanceGuard({
  children,
  role
}: {
  children: React.ReactNode
  role?: string
}) {
  const pathname = usePathname()
  const [maintenance, setMaintenance] = useState<SystemMaintenanceSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(role || null)

  useEffect(() => {
    getMaintenanceSettings()
      .then(settings => {
        setMaintenance(settings)
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Securely fetch user role using server-validated Supabase Auth & profile database query
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (profile?.role) {
            setUserRole(profile.role)
          }
        } else {
          setUserRole(null)
        }
      } catch (e) {
        console.error('Error fetching user role for maintenance guard:', e)
      }
    }

    fetchUserRole()

    // Listen to authentication state changes dynamically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setUserRole(profile?.role || null)
      } else {
        setUserRole(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [role])

  // Public authentication, recovery, and auth callback routes must always remain accessible
  const isExempt = EXEMPT_AUTH_ROUTES.some(
    route => pathname === route || pathname?.startsWith(`${route}/`)
  )

  if (isExempt) {
    return <>{children}</>
  }

  if (loading || !maintenance || !maintenance.enabled) {
    return <>{children}</>
  }

  const activeRole = role || userRole

  // Check role bypass logic
  const isBypassed =
    (activeRole === 'admin' && maintenance.allow_admin_bypass) ||
    (activeRole === 'manager' && maintenance.allow_manager_bypass)

  if (isBypassed) {
    return (
      <>
        {/* Minimal admin bypass indicator badge */}
        <div className="bg-amber-500/20 text-amber-500 border-b border-amber-500/30 px-4 py-1 text-center font-mono text-xs flex items-center justify-center gap-2">
          <ShieldAlert size={14} />
          <span>System Maintenance Mode Active — Admin/Manager Access Bypassed</span>
        </div>
        {children}
      </>
    )
  }

  // Render Full Maintenance Page for non-bypassed users
  return (
    <div className="fixed inset-0 z-[9999] min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans overflow-auto">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <Wrench size={32} />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 inline-block">
            Platform Maintenance
          </span>
          <h1 className="text-2xl font-bold text-zinc-100">Temporarily Unavailable</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {maintenance.message || 'We are currently performing essential platform upgrades to improve service performance.'}
          </p>
        </div>

        {(maintenance.starts_at || maintenance.ends_at) && (
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs text-zinc-400 text-left">
            {maintenance.starts_at && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Clock size={13} /> Started:</span>
                <span className="text-zinc-200">{new Date(maintenance.starts_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
              </div>
            )}
            {maintenance.ends_at && (
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2">
                <span className="flex items-center gap-1.5"><Clock size={13} /> Expected Return:</span>
                <span className="text-emerald-400 font-bold">{new Date(maintenance.ends_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-semibold transition-colors border border-zinc-700"
          >
            <span>Administrator Login</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
