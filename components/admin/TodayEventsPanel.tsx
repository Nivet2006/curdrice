'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar as CalendarIcon, ArrowRight, MapPin, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface EventItem {
  id: string
  title: string
  date: string
  location: string
  registeredCount?: number
  checkedInCount?: number
}

export function TodayEventsPanel() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      setLoading(true)
      try {
        const { data: rawEvents } = await supabase
          .from('events')
          .select('id, title, date, location')
          .order('date', { ascending: true })
          .limit(4)

        if (rawEvents && rawEvents.length > 0) {
          // Fetch registration metrics per event
          const enriched = await Promise.all(
            rawEvents.map(async (e: any) => {
              const [regCountRes, checkInCountRes] = await Promise.all([
                supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', e.id),
                supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', e.id).eq('checked_in', true)
              ])
              return {
                ...e,
                registeredCount: regCountRes.count || 0,
                checkedInCount: checkInCountRes.count || 0,
              }
            })
          )
          setEvents(enriched)
        }
      } catch (err) {
        console.error('Error fetching today events:', err)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse space-y-3">
        <div className="h-4 w-32 bg-[var(--bg-subtle)] rounded" />
        <div className="h-16 bg-[var(--bg-subtle)] rounded-xl" />
      </div>
    )
  }

  return (
    <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-[var(--fg)]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg)]">
            Schedule & Today&apos;s Events
          </h2>
        </div>
        <Link
          href="/admin/calendar"
          className="font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-1 font-semibold"
        >
          <span>View calendar</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="font-mono text-xs text-[var(--fg-muted)] py-4 text-center">
          No active events scheduled for today.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)]">
                    {event.date ? new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBA'}
                  </span>
                  <p className="text-xs font-bold text-[var(--fg)] truncate">{event.title}</p>
                </div>
                {event.location && (
                  <p className="font-mono text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                    <MapPin size={10} /> {event.location}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] font-semibold text-[var(--fg-muted)]">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {event.registeredCount} reg
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {event.checkedInCount} checked in
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
