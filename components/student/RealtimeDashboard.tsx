'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardEventTabs } from './DashboardEventTabs'
import type { Event, Profile } from '@/lib/types'

interface Registration {
  event_id: string
  qr_token: string
  events: unknown
}

interface Props {
  initialEvents: Event[]
  registrations: Registration[]
  profile: Profile
}

export function RealtimeDashboard({ initialEvents, registrations, profile }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('events-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          const newEvent = payload.new as Event
          // Only show upcoming events in dashboard tabs (matches server query)
          if (newEvent.status === 'upcoming') {
            setEvents(prev =>
              [...prev, newEvent]
                .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                .slice(0, 6)
            )
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          setEvents(prev =>
            prev.map(e => e.id === payload.new.id ? (payload.new as Event) : e)
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'events' },
        (payload) => {
          setEvents(prev => prev.filter(e => e.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <DashboardEventTabs
      initialEvents={events}
      registrations={registrations}
      profile={profile}
    />
  )
}