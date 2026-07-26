'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, ArrowUpRight, Clock } from 'lucide-react'

interface ShowcaseEventsProps {
  events: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseEventsSection({ events = [], clubName, primaryColor = '#f59e0b' }: ShowcaseEventsProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'previous'>('upcoming')

  const now = new Date()
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= now || e.status === 'upcoming')
  const previousEvents = events.filter(e => new Date(e.event_date) < now || e.status === 'completed')

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : previousEvents

  return (
    <section id="events" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div>
            <span
              className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block mb-3 shadow-sm"
              style={{ color: primaryColor }}
            >
              CLUB EVENTS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
              Event Showcase
            </h2>
          </div>

          {/* Tabs switch */}
          <div className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-md shadow-sm self-start md:self-auto">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === 'previous'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Previous ({previousEvents.length})
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {displayedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedEvents.map(event => (
              <div
                key={event.id}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden group hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xl"
              >
                {/* Event Banner */}
                {event.banner_url ? (
                  <div className="h-48 w-full overflow-hidden relative">
                    <img
                      src={event.banner_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 border border-zinc-200 dark:border-zinc-700">
                      {event.is_public ? 'Public Event' : 'Campus Event'}
                    </div>
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-850 dark:to-zinc-950 p-6 flex flex-col justify-between border-b border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                      {clubName}
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase font-mono line-clamp-1">{event.title}</h3>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-4 flex-1">
                  {event.banner_url && (
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase font-mono group-hover:text-amber-500 transition-colors">
                      {event.title}
                    </h3>
                  )}
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {event.description || 'Join us for this event! Full schedule and details inside.'}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-amber-500 shrink-0" />
                      <span>{new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-amber-500 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <Link
                    href={`/events/${event.id}`}
                    className="w-full py-3 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center justify-center gap-2 transition-all"
                  >
                    View Details <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <Clock size={36} className="mx-auto text-zinc-400 dark:text-zinc-600 animate-pulse" />
            <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-bold">
              No {activeTab} events listed currently
            </p>
            <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500">Check back soon for new announcements!</p>
          </div>
        )}
      </div>
    </section>
  )
}
