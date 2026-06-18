'use client'

import { useEffect, useState } from 'react'
import { EventCalendar } from '@/components/shared/EventCalendar'
import { supabase } from '@/lib/supabase/client'
import type { Event, Role } from '@/lib/types'

interface RealtimeStaffCalendarProps {
  initialEvents: Event[]
  role: Role
}

export function RealtimeStaffCalendar({ initialEvents, role }: RealtimeStaffCalendarProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [regCounts, setRegCounts] = useState<Record<string, number>>({})

  // Keep events in sync via realtime
  useEffect(() => {
    const channel = supabase
      .channel('staff-calendar-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
        setEvents(prev =>
          [...prev, payload.new as Event].sort(
            (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
          )
        )
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, (payload) => {
        setEvents(prev => prev.map(e => e.id === payload.new.id ? (payload.new as Event) : e))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events' }, (payload) => {
        setEvents(prev => prev.filter(e => e.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch registration counts
  useEffect(() => {
    async function fetchCounts() {
      if (events.length === 0) return
      const ids = events.map(e => e.id)
      const { data } = await supabase
        .from('registrations')
        .select('event_id')
        .in('event_id', ids)
      if (!data) return
      const counts: Record<string, number> = {}
      for (const r of data) counts[r.event_id] = (counts[r.event_id] ?? 0) + 1
      setRegCounts(counts)
    }
    fetchCounts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length])

  return (
    <EventCalendar
      events={events}
      registrationCounts={regCounts}
      role={role}
    />
  )
}
