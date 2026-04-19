'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { logAudit } from '@/lib/actions/audit'

export function AuditTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Generate session ID if not exists
    if (typeof document !== 'undefined' && !document.cookie.includes('audit_session_id=')) {
      const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      document.cookie = `audit_session_id=${newId}; path=/; max-age=86400; SameSite=Lax`;
    }
  }, [])

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Non-blocking log
    logAudit('NAVIGATION', { url }).catch(console.error);

  }, [pathname, searchParams])

  return null // Renderless component
}
