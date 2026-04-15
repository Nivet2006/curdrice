'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Users, QrCode, ChevronRight } from 'lucide-react'
import type { Event } from '@/lib/types'
import { QRDisplay } from '@/components/student/QRDisplay'

type Props = {
  events: Event[]
  registrationMap: Record<string, string>
  studentName: string
  studentUsn: string
}

type GroupedEvents = {
  dateKey: string
  dateLabel: string
  dayLabel: string
  events: Event[]
}

export function CalendarView({ events, registrationMap, studentName, studentUsn }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [search, setSearch] = useState('')
  const [activeQR, setActiveQR] = useState<{
    token: string
    eventName: string
  } | null>(null)

  const now = new Date()

  const filtered = useMemo(() => {
    return events.filter(e => {
      const d = new Date(e.event_date)
      const isUpcoming = d >= now
      const matchesTab = tab === 'upcoming' ? isUpcoming : !isUpcoming
      const matchesSearch = search.trim() === '' ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.location || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.club_name || '').toLowerCase().includes(search.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [events, tab, search, now])

  const grouped = useMemo(() => {
    const map: Record<string, GroupedEvents> = {}
    for (const e of filtered) {
      const d = new Date(e.event_date)
      const key = d.toDateString()
      if (!map[key]) {
        const isToday = d.toDateString() === now.toDateString()
        const isYesterday = new Date(now.getTime() - 86400000).toDateString() === key
        const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === key
        map[key] = {
          dateKey: key,
          dateLabel: isToday ? 'Today' : isYesterday ? 'Yesterday' : isTomorrow ? 'Tomorrow' :
            d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          dayLabel: isToday || isYesterday || isTomorrow ? 
            d.toLocaleDateString('en-IN', { weekday: 'long' }) :
            d.toLocaleDateString('en-IN', { weekday: 'long' }),
          events: []
        }
      }
      map[key].events.push(e)
    }
    return Object.values(map).sort((a, b) =>
      tab === 'upcoming'
        ? new Date(a.events[0].event_date).getTime() - new Date(b.events[0].event_date).getTime()
        : new Date(b.events[0].event_date).getTime() - new Date(a.events[0].event_date).getTime()
    )
  }, [filtered, tab])

  return (
    <div className="w-full pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-[#0a0a0a]">Events</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] font-mono w-[200px] md:w-[280px]"
            style={{ background: 'var(--bg)' }}
          />
          <div className="flex rounded-full border border-[#e0e0e0] overflow-hidden"
            style={{ background: 'var(--bg-subtle)' }}>
            <button
              onClick={() => setTab('upcoming')}
              className={`px-5 py-2 text-sm font-mono transition-colors ${
                tab === 'upcoming'
                  ? 'bg-[#0a0a0a] text-white'
                  : 'text-[#555555] hover:text-[#0a0a0a]'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTab('past')}
              className={`px-5 py-2 text-sm font-mono transition-colors ${
                tab === 'past'
                  ? 'bg-[#0a0a0a] text-white'
                  : 'text-[#555555] hover:text-[#0a0a0a]'
              }`}
            >
              Past
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Timeline */}
      {grouped.length === 0 ? (
        <div className="text-center py-20 font-mono text-sm text-[#999]">
          No {tab} events found.
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {grouped.map((group) => (
            <div key={group.dateKey} className="flex gap-4 md:gap-8">

              {/* Date column */}
              <div className="w-[80px] md:w-[120px] flex-shrink-0 pt-4">
                <p className="font-black text-[#0a0a0a] text-base leading-tight">
                  {group.dateLabel}
                </p>
                <p className="font-mono text-xs text-[#999999] mt-0.5">
                  {group.dayLabel}
                </p>
              </div>

              {/* Timeline dot + line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-[1px] h-5 bg-[#e0e0e0]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#555555] flex-shrink-0" />
                <div className="w-[1px] flex-1 bg-[#e0e0e0] mt-1" />
              </div>

              {/* Events for this date */}
              <div className="flex-1 flex flex-col gap-3 py-4 pb-8 min-w-0">
                {group.events.map(event => {
                  const isRegistered = !!registrationMap[event.id]
                  const qrToken = registrationMap[event.id]
                  const eventTime = new Date(event.event_date)
                    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 rounded-2xl border border-[#e0e0e0] p-4 hover:border-[#b0b0b0] transition-colors group"
                      style={{ background: 'var(--bg-card)' }}
                    >
                      {/* Banner thumbnail */}
                      <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-xl overflow-hidden bg-[#f5f5f5] flex-shrink-0 border border-[#e0e0e0]">
                        {event.banner_url ? (
                          <img
                            src={event.banner_url}
                            alt={event.title}
                            className="w-full h-full object-cover grayscale"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-mono text-[#ccc] text-[10px]">
                            NO IMG
                          </div>
                        )}
                      </div>

                      {/* Event details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-[#999] mb-1 flex items-center gap-1">
                              <Clock size={11} />
                              {eventTime}
                            </p>
                            <h3 className="font-bold text-[#0a0a0a] text-sm md:text-base leading-tight line-clamp-2">
                              {event.title}
                            </h3>
                            <p className="font-mono text-xs text-[#555] mt-1">
                              By {event.club_name}
                            </p>
                          </div>

                          {/* Registered badge */}
                          {isRegistered && (
                            <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-widest bg-[#0a0a0a] text-white px-2.5 py-1 rounded-full">
                              Going
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          {event.location && (
                            <p className="font-mono text-xs text-[#999] flex items-center gap-1 truncate">
                              <MapPin size={11} />
                              {event.location}
                            </p>
                          )}
                          {event.max_capacity && (
                            <p className="font-mono text-xs text-[#999] flex items-center gap-1">
                              <Users size={11} />
                              {event.max_capacity} seats
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {isRegistered && qrToken && (
                            <button
                              onClick={() => setActiveQR({
                                token: qrToken,
                                eventName: event.title
                              })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e0e0e0] font-mono text-xs text-[#555] hover:bg-[#f5f5f5] transition-colors"
                            >
                              <QrCode size={12} />
                              View QR
                            </button>
                          )}
                          <Link
                            href={`/student/events/${event.id}`}
                            className="flex items-center gap-1 font-mono text-xs text-[#555] hover:text-[#0a0a0a] transition-colors"
                          >
                            Details <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {activeQR && (
        <QRDisplay
          token={activeQR.token}
          studentName={studentName}
          usn={studentUsn}
          eventName={activeQR.eventName}
          onClose={() => setActiveQR(null)}
        />
      )}
    </div>
  )
}
