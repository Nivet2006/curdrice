'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { SystemAnnouncement } from '@/lib/types'
import { getActiveAnnouncements } from '@/lib/actions/announcements'
import { supabase } from '@/lib/supabase/client'

interface GlobalAnnouncementContextType {
  announcements: SystemAnnouncement[]
  dismissedIds: string[]
  dismissAnnouncement: (id: string) => void
  refreshAnnouncements: () => Promise<void>
}

const GlobalAnnouncementContext = createContext<GlobalAnnouncementContextType>({
  announcements: [],
  dismissedIds: [],
  dismissAnnouncement: () => {},
  refreshAnnouncements: async () => {}
})

export function GlobalAnnouncementProvider({
  children,
  role,
  userId
}: {
  children: React.ReactNode
  role?: string
  userId?: string
}) {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  // Load dismissed items from localStorage
  useEffect(() => {
    try {
      const dismissed: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('announcement:') && key.endsWith(':dismissed')) {
          const id = key.replace('announcement:', '').replace(':dismissed', '')
          dismissed.push(id)
        }
      }
      setDismissedIds(dismissed)
    } catch (e) {
      console.error('Error reading localStorage dismissed announcements:', e)
    }
  }, [])

  const loadAnnouncements = useCallback(async () => {
    try {
      const active = await getActiveAnnouncements(role, userId)
      setAnnouncements(active)
    } catch (err) {
      console.error('Error loading active announcements:', err)
    }
  }, [role, userId])

  // Fetch ONCE on mount or when auth/role changes (No aggressive polling!)
  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  // Subscribe to Realtime ONLY if urgent / critical announcements are present or pushed
  useEffect(() => {
    const hasUrgentRealtime = announcements.some(a => a.severity === 'CRITICAL' || a.channels.includes('REALTIME_ALERT'))

    if (!hasUrgentRealtime) return

    const channel = supabase
      .channel('shared-global-announcements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'system_announcements'
      }, () => {
        loadAnnouncements()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [announcements, loadAnnouncements])

  const dismissAnnouncement = (id: string) => {
    try {
      localStorage.setItem(`announcement:${id}:dismissed`, 'true')
      setDismissedIds(prev => [...prev, id])
    } catch (e) {
      console.error('Failed to save dismissal:', e)
    }
  }

  return (
    <GlobalAnnouncementContext.Provider
      value={{
        announcements,
        dismissedIds,
        dismissAnnouncement,
        refreshAnnouncements: loadAnnouncements
      }}
    >
      {children}
    </GlobalAnnouncementContext.Provider>
  )
}

export function useGlobalAnnouncements() {
  return useContext(GlobalAnnouncementContext)
}
