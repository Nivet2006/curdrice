'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'

/**
 * Subscribes to registration counts for a set of events.
 * Returns a Record<eventId, count> that updates in real-time
 * whenever any registration changes.
 *
 * Lightweight: fetches only event_id (no profile join).
 */
export function useAttendanceCounts(events: Event[]): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (events.length === 0) {
      setCounts({})
      return
    }

    const eventIds = events.map(e => e.id)

    async function fetchCounts() {
      const { data, error } = await supabase
        .from('registrations')
        .select('event_id')
        .in('event_id', eventIds)

      if (error || !data) return

      const result: Record<string, number> = {}
      for (const id of eventIds) result[id] = 0
      for (const row of data) {
        if (row.event_id in result) result[row.event_id]++
      }
      setCounts(result)
    }

    fetchCounts()

    const channel = supabase
      .channel('attendance-counts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => fetchCounts()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [events]) // supabase is a singleton — stable, safe to omit

  return counts
}
