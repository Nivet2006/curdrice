import React from 'react'
import { getPRAssignedEvents } from '@/lib/actions/pr-actions'
import Link from 'next/link'
import { Calendar, MapPin, Users, UserCheck, ScanLine, Eye, Lock } from 'lucide-react'

export default async function PREventsPage() {
  const { data: events, error } = await getPRAssignedEvents()

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0a0a0a] dark:bg-white flex items-center justify-center shadow-lg">
            <Calendar size={20} className="text-white dark:text-black" />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold">Assigned Events</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] dark:text-white leading-none uppercase">My Events</h1>
        <p className="text-zinc-500 font-medium italic max-w-lg">
          Events assigned to you by faculty. View attendees, take attendance, and monitor participation.
        </p>
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-2 rounded-xl w-fit">
          <Lock size={12} className="text-amber-600" />
          <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase tracking-widest font-bold">View-Only Access • No Edit Permissions</span>
        </div>
      </div>

      {/* Events Grid */}
      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event: Record<string, unknown>) => (
            <div key={event.id as string} className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:border-[#0a0a0a] dark:hover:border-white transition-all">
              {/* Banner */}
              <div className="aspect-[16/9] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                {event.banner_url ? (
                  <img src={event.banner_url as string} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-300 dark:text-zinc-600 font-mono text-xs italic">No Banner</div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-widest border ${
                    event.status === 'completed' ? 'bg-emerald-500/90 text-white border-emerald-600' :
                    event.status === 'ongoing' ? 'bg-amber-500/90 text-white border-amber-600' :
                    'bg-white/90 text-black border-zinc-200'
                  }`}>
                    {event.status as string}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-[#0a0a0a] dark:text-white uppercase tracking-tighter leading-tight">{event.title as string}</h3>
                  <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest mt-1">{event.club_name as string}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                      <MapPin size={10} />
                      <span className="text-[9px] font-mono uppercase tracking-wider">Venue</span>
                    </div>
                    <p className="text-xs font-bold text-[#0a0a0a] dark:text-white">{(event.location as string) || 'TBA'}</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                      <Calendar size={10} />
                      <span className="text-[9px] font-mono uppercase tracking-wider">Date</span>
                    </div>
                    <p className="text-xs font-bold text-[#0a0a0a] dark:text-white">{new Date(event.event_date as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-zinc-400" />
                    <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">{event.registration_count as number}</span>
                    <span className="text-[9px] text-zinc-400 font-mono">Registered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={12} className="text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600">{event.attendance_count as number}</span>
                    <span className="text-[9px] text-zinc-400 font-mono">Present</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/pr/events/${event.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-800 text-[#0a0a0a] dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Eye size={14} />
                    Attendees
                  </Link>
                  <Link
                    href={`/pr/events/${event.id}/scan`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0a0a0a] dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                  >
                    <ScanLine size={14} />
                    Scan
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-zinc-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
          <Calendar size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-6" />
          <p className="text-zinc-600 dark:text-zinc-400 font-black text-xl uppercase tracking-widest">No Events Assigned</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Contact your faculty to get assigned to events.</p>
        </div>
      )}
    </div>
  )
}
