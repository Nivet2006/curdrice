import React from 'react'
import { getEventAttendees } from '@/lib/actions/pr-actions'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ScanLine, Lock } from 'lucide-react'
import { PRAttendeeTableClient } from './PRAttendeeTableClient'

export default async function PREventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: event } = await supabase
    .from('events')
    .select('id, title, club_name, event_date, location, status, max_capacity')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { data: attendees, error } = await getEventAttendees(id)

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center space-y-6">
        <Lock size={48} className="mx-auto text-rose-400" />
        <h1 className="text-3xl font-black uppercase text-rose-500">Access Denied</h1>
        <p className="text-zinc-500 font-mono text-sm">{error}</p>
        <Link href="/pr/events" className="inline-block px-6 py-3 bg-[#0a0a0a] text-white rounded-xl text-xs font-bold uppercase">
          Return to Events
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-20">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/pr/events" className="flex items-center gap-2 text-zinc-400 hover:text-black dark:hover:text-white font-mono text-[10px] uppercase font-black tracking-widest transition-all">
          <ArrowLeft size={14} />
          Back to Events
        </Link>
        <Link
          href={`/pr/events/${id}/scan`}
          className="flex items-center gap-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg"
        >
          <ScanLine size={14} />
          Scan for this Event
        </Link>
      </div>

      {/* Event Header */}
      <header className="border-b-4 border-black dark:border-white pb-8 space-y-3">
        <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] dark:text-white uppercase leading-tight">{event.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-zinc-500 uppercase">
          <span className="font-bold text-black dark:text-white">{event.club_name}</span>
          <span>•</span>
          <span>{event.location || 'TBA'}</span>
          <span>•</span>
          <span>{new Date(event.event_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
          <span>•</span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
            event.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
            event.status === 'ongoing' ? 'bg-amber-50 text-amber-600 border-amber-200' :
            'bg-zinc-50 text-zinc-600 border-zinc-200'
          }`}>{event.status}</span>
        </div>
      </header>

      {/* Attendee Table with Export */}
      <PRAttendeeTableClient
        attendees={attendees || []}
        eventTitle={event.title}
        eventId={event.id}
        clubName={event.club_name}
        eventDate={event.event_date}
      />
    </div>
  )
}
