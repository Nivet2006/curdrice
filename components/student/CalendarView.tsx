'use client'

import React, { useState, useEffect } from 'react'
import { EventCalendar } from '@/components/shared/EventCalendar'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'

type Props = {
  events: Event[]
  registrationMap: Record<string, string>
  studentName: string
  studentUsn: string
}

export function CalendarView({ events, registrationMap }: Props) {
  const supabase = createClient()
  const [regCounts, setRegCounts] = useState<Record<string, number>>({})

  // Fetch registration counts for all visible events (client-side, one-time)
  useEffect(() => {
    async function fetchCounts() {
      if (events.length === 0) return
      const eventIds = events.map(e => e.id)
      const { data } = await supabase
        .from('registrations')
        .select('event_id')
        .in('event_id', eventIds)

      if (!data) return
      const counts: Record<string, number> = {}
      for (const r of data) {
        counts[r.event_id] = (counts[r.event_id] ?? 0) + 1
      }
      setRegCounts(counts)
    }
    fetchCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length])

  return (
    <EventCalendar
      events={events}
      registrationMap={registrationMap}
      registrationCounts={regCounts}
      role="student"
    />
  )
}
