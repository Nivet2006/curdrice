'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Search, MapPin, Clock, Video, QrCode } from 'lucide-react'
import type { Event, Profile } from '@/lib/types'
import { QRDisplay } from '@/components/student/QRDisplay'

interface Props {
  initialEvents: Event[]
  registrations: { event_id: string; qr_token: string }[]
  profile: Profile | null
}

type GroupedEvents = {
  dateKey: string
  dateLabel: string
  dayLabel: string
  events: Event[]
}

export function StudentEventsView({ initialEvents, registrations, profile }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [activeQR, setActiveQR] = useState<{
    token: string
    eventName: string
  } | null>(null)

  const supabase = createClient()
  const now = useMemo(() => new Date(), [])

  // Real-time events update
  useEffect(() => {
    const channel = supabase
      .channel('student-events-timeline-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          const newEvent = payload.new as Event
          if (newEvent.approval_status === 'approved') {
            setEvents(prev =>
              [...prev, newEvent].sort(
                (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
              )
            )
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          const updated = payload.new as Event
          if (updated.approval_status !== 'approved') {
            setEvents(prev => prev.filter(e => e.id !== updated.id))
          } else {
            setEvents(prev =>
              prev.map(e => e.id === updated.id ? updated : e)
            )
          }
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Filtered events by tab and search
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const d = new Date(e.event_date)
      const isUpcoming = d >= now
      const matchesTab = activeTab === 'upcoming' ? isUpcoming : !isUpcoming
      
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch = query === '' ||
        e.title.toLowerCase().includes(query) ||
        (e.location || '').toLowerCase().includes(query) ||
        (e.club_name || '').toLowerCase().includes(query)
      
      return matchesTab && matchesSearch
    })
  }, [events, activeTab, searchQuery, now])

  // Group events by date for timeline layout
  const groupedEvents = useMemo(() => {
    const map: Record<string, GroupedEvents> = {}
    for (const e of filteredEvents) {
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
          dayLabel: d.toLocaleDateString('en-IN', { weekday: 'long' }),
          events: []
        }
      }
      map[key].events.push(e)
    }
    
    return Object.values(map).sort((a, b) =>
      activeTab === 'upcoming'
        ? new Date(a.events[0].event_date).getTime() - new Date(b.events[0].event_date).getTime()
        : new Date(b.events[0].event_date).getTime() - new Date(a.events[0].event_date).getTime()
    )
  }, [filteredEvents, activeTab, now])

  return (
    <div className="w-full pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-[#0a0a0a] uppercase tracking-tight">Events</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-[280px]">
            <Search className="absolute left-4 top-[10px] text-[#999999]" size={18} />
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[#d0d0d0] bg-white pl-12 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] font-sans text-black"
            />
          </div>
          <div className="flex rounded-full border border-[#e0e0e0] overflow-hidden bg-[#f5f5f5] shrink-0">
            {(['upcoming', 'past'] as const).map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 text-sm font-mono transition-colors uppercase tracking-wider ${
                    isActive 
                      ? 'bg-[#0a0a0a] text-white' 
                      : 'text-[#555555] hover:text-[#0a0a0a]'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Calendar Timeline */}
      {groupedEvents.length === 0 ? (
        <div className="text-center py-20 font-mono text-sm text-[#999] bg-white rounded-2xl border border-zinc-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          No {activeTab} events found.
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {groupedEvents.map((group) => (
            <div key={group.dateKey} className="flex gap-4 md:gap-8">
              
              {/* Date column (Left) */}
              <div className="w-[80px] md:w-[120px] flex-shrink-0 pt-6">
                <p className="font-black text-[#0a0a0a] text-lg leading-tight uppercase tracking-tight">
                  {group.dateLabel}
                </p>
                <p className="font-sans text-xs text-[#999999] font-medium mt-0.5">
                  {group.dayLabel}
                </p>
              </div>

              {/* Timeline Track & Dot (Middle) */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-[1px] h-7 bg-zinc-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 flex-shrink-0 relative">
                  {activeTab === 'upcoming' && group.dateLabel === 'Today' && (
                    <span className="absolute -inset-1 rounded-full bg-rose-500/20 animate-ping" />
                  )}
                </div>
                <div className="w-[1px] flex-1 bg-zinc-200 mt-1" />
              </div>

              {/* Event Cards (Right) */}
              <div className="flex-1 flex flex-col gap-5 py-4 pb-8 min-w-0">
                {group.events.map((event) => {
                  const reg = registrations.find(r => r.event_id === event.id)
                  const isRegistered = !!reg
                  const qrToken = reg?.qr_token
                  const isOngoing = event.status === 'ongoing'
                  
                  const eventTime = new Date(event.event_date).toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })

                  // Random mock attendee count to match premium look of the image
                  const mockCount = Math.floor(Math.sin(event.id.charCodeAt(0)) * 200) + 120

                  return (
                    <div
                      key={event.id}
                      className="bg-white border border-zinc-100/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[20px] p-5 md:p-6 hover:shadow-[0_12px_45px_rgb(0,0,0,0.06)] hover:border-zinc-200/80 transition-all duration-300 flex flex-col md:flex-row gap-6 items-stretch group"
                    >
                      {/* Event Details (Left half of card) */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          {/* Live Indicator or Time */}
                          {isOngoing ? (
                            <div className="flex items-center gap-1.5 font-mono text-xs text-rose-500 font-black uppercase tracking-wider mb-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                              LIVE
                              <span className="text-zinc-400 font-normal ml-1">{eventTime}</span>
                            </div>
                          ) : (
                            <div className="font-mono text-xs text-zinc-400 font-semibold mb-2">{eventTime}</div>
                          )}

                          {/* Title */}
                          <h3 className="font-bold text-[#0a0a0a] text-lg md:text-xl tracking-tight leading-snug line-clamp-2 hover:text-[#555] transition-colors">
                            <Link href={`/student/events/${event.id}`}>
                              {event.title}
                            </Link>
                          </h3>

                          {/* Host info */}
                          <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500 font-medium">
                            <div className="flex -space-x-1.5 shrink-0">
                              <div className="w-5 h-5 rounded-full bg-zinc-800 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white uppercase">{event.club_name?.[0] || 'C'}</div>
                              <div className="w-5 h-5 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-zinc-600">👤</div>
                            </div>
                            <span>By <span className="text-zinc-800 font-bold">{event.club_name || 'Campus Club'}</span></span>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-400 font-mono">
                            <MapPin size={13} className="text-zinc-300 flex-shrink-0" />
                            <span className="truncate">{event.location || 'Virtual'}</span>
                          </div>
                        </div>

                        {/* Interactive Buttons / Badge Bar */}
                        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-zinc-100">
                          <div className="flex items-center gap-2">
                            {isRegistered ? (
                              <div className="flex gap-2">
                                <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                                  Going ✓
                                </span>
                                {qrToken && (
                                  <button
                                    onClick={() => setActiveQR({ token: qrToken, eventName: event.title })}
                                    className="flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-200 font-mono text-[10px] uppercase font-bold text-[#555] hover:bg-zinc-50 transition-colors"
                                  >
                                    <QrCode size={11} />
                                    QR
                                  </button>
                                )}
                              </div>
                            ) : (
                              <Link
                                href={`/student/events/${event.id}`}
                                className="inline-flex items-center gap-1.5 bg-[#0a0a0a] text-white hover:bg-zinc-800 text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
                              >
                                {event.location?.toLowerCase().includes('virtual') || !event.location ? (
                                  <>
                                    <Video size={13} /> Join Event
                                  </>
                                ) : (
                                  'Register'
                                )}
                              </Link>
                            )}
                          </div>

                          {/* Attendee Avatar Cluster */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1">
                              <div className="w-5 h-5 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[7px] font-bold text-blue-700">A</div>
                              <div className="w-5 h-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[7px] font-bold text-emerald-700">J</div>
                              <div className="w-5 h-5 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[7px] font-bold text-amber-700">R</div>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 font-bold">+{mockCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Banner Poster (Right side of card) */}
                      <div className="w-full md:w-[130px] md:h-[130px] aspect-square rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100/80 flex-shrink-0 flex items-center justify-center relative md:self-center">
                        {event.banner_url ? (
                          <img
                            src={event.banner_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-zinc-100 to-zinc-50 font-mono text-zinc-300 text-[10px] uppercase font-bold tracking-widest text-center px-2 select-none">
                            Poster
                          </div>
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>
              
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal for going status */}
      {activeQR && (
        <QRDisplay
          token={activeQR.token}
          studentName={profile?.full_name || ''}
          usn={profile?.usn || ''}
          eventName={activeQR.eventName}
          onClose={() => setActiveQR(null)}
        />
      )}
    </div>
  )
}
