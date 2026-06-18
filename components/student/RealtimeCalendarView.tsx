'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CalendarView } from './CalendarView'
import type { Event } from '@/lib/types'

interface Props {
  initialEvents: Event[]
  registrationMap: Record<string, string>
  studentName: string
  studentUsn: string
}

export function RealtimeCalendarView({ initialEvents, registrationMap, studentName, studentUsn }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents)

  useEffect(() => {
    const channel = supabase
      .channel('events-calendar-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          setEvents(prev =>
            [...prev, payload.new as Event].sort(
              (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
            )
          )
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
    <CalendarView
      events={events}
      registrationMap={registrationMap}
      studentName={studentName}
      studentUsn={studentUsn}
    />
  )
}