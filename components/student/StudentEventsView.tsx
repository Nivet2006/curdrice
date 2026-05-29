'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EventCard } from './EventCard'
import { Search } from 'lucide-react'
import type { Event, Profile } from '@/lib/types'

interface Props {
  initialEvents: Event[]
  registrations: { event_id: string; qr_token: string }[]
  profile: Profile | null
}

export function StudentEventsView({ initialEvents, registrations, profile }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all')
  
  const supabase = createClient()

  // Real-time events update
  useEffect(() => {
    const channel = supabase
      .channel('student-events-realtime')
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

  // Filtered and searched events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // 1. Filter by tab
      if (activeTab !== 'all' && event.status !== activeTab) {
        return false
      }
      
      // 2. Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const titleMatch = event.title?.toLowerCase().includes(query)
        const descMatch = event.description?.toLowerCase().includes(query)
        const clubMatch = event.club_name?.toLowerCase().includes(query)
        const locMatch = event.location?.toLowerCase().includes(query)
        return titleMatch || descMatch || clubMatch || locMatch
      }
      
      return true
    })
  }, [events, activeTab, searchQuery])

  return (
    <div className="w-full">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-[#0a0a0a] uppercase tracking-tight">Events</h1>
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-[10px] text-[#999999]" size={18} />
          <input 
            type="text" 
            placeholder="Search events by title, club, location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[#d0d0d0] bg-white pl-12 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] font-sans text-black"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(['all', 'upcoming', 'ongoing', 'completed'] as const).map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono text-xs px-4 py-1.5 rounded-full transition-colors border uppercase tracking-wider ${
                isActive 
                  ? 'bg-black text-white border-black hover:bg-[#333]' 
                  : 'bg-white text-[#555] border-[#e0e0e0] hover:bg-[#f5f5f5]'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
          <p className="col-span-full font-mono text-xs text-[#999999] p-8 border border-dashed border-[#e0e0e0] rounded-2xl text-center">
            No events found.
          </p>
        ) : (
          filteredEvents.map((event) => {
            const reg = registrations.find(r => r.event_id === event.id)
            return (
              <EventCard 
                key={event.id} 
                event={event}
                isRegistered={!!reg}
                qrToken={reg?.qr_token}
                studentName={profile?.full_name}
                usn={profile?.usn}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
