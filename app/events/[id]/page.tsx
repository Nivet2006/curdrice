import { supabaseAdmin } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CalendarDays, MapPin, Users, Clock, ExternalLink, Download } from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/lib/types'
import { withDynamicSingleEventStatus } from '@/lib/event-utils'
import { EventStatusBadge } from '@/components/ui/EventStatusBadge'

export default async function PublicEventDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch using supabaseAdmin to bypass RLS for anonymous public view
  const { data: data, error: fetchError } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  const event = data ? withDynamicSingleEventStatus(data as Event) : null

  // Ensure event exists, is public, and is approved
  if (!event || !event.is_public || event.approval_status !== 'approved') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans px-6 bg-white text-[#0a0a0a]">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ffeded] border border-[#eb4b4b] flex items-center justify-center text-[#eb4b4b] font-mono font-bold text-2xl">
            !
          </div>
          <h1 className="text-2xl font-black tracking-tight">Event is Private or Unavailable</h1>
          <p className="text-sm font-mono text-[#555555]">
            This event does not exist, requires authorization to view, or has not been approved yet.
          </p>
          <div className="pt-4">
            <Link 
              href="/login" 
              className="inline-block px-6 py-3 rounded-xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-all shadow-md"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch attendee count using supabaseAdmin to bypass registrations RLS
  const { count: registeredCount } = await supabaseAdmin
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)

  const regCount = registeredCount || 0
  const maxCap = event.max_capacity || Infinity
  const progressPct = Math.min((regCount / maxCap) * 100, 100)

  return (
    <div className="min-h-screen bg-white">
      {/* Sleek Minimal Header */}
      <header className="border-b border-[#e0e0e0] px-8 py-5">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center">
          <div className="font-mono font-bold text-lg">{'>'} Club-Eve</div>
          <Link 
            href={`/login?redirectTo=/student/events/${id}`}
            className="text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 border border-black rounded-xl hover:bg-zinc-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Detail Container */}
      <main className="max-w-[1280px] mx-auto px-8 py-12">
        <Link href="/login" className="inline-block font-mono text-sm text-[#555555] hover:text-[#0a0a0a] mb-6 transition-colors">
          ← Back to Login
        </Link>

        {/* Banner */}
        <div className="w-full aspect-[3/1] rounded-2xl bg-[#f5f5f5] mb-10 overflow-hidden relative border border-[#e0e0e0]">
          {event.banner_url ? (
            <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover grayscale" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-mono text-[#999] text-xs">NO BANNER</div>
          )}
        </div>

        {/* Content Structure */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Info */}
          <div className="flex-1">
            <div className="flex gap-3 mb-4">
              <span className="border-[1.5px] border-[#0a0a0a] text-[#0a0a0a] font-mono rounded-full px-3 py-1 text-xs">{event.club_name}</span>
              <EventStatusBadge status={event.status} className="px-3 py-1 text-xs rounded-full" />
            </div>
            
            <h1 className="text-3xl font-black text-[#0a0a0a] mb-6">{event.title}</h1>
            <p className="text-base text-[#555555] mb-8 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            
            <div className="space-y-4 font-mono text-sm text-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-[#555555]" size={18} />
                <span>{new Date(event.event_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-[#555555]" size={18} />
                <span>{new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-[#555555]" size={18} />
                <span>{event.location || 'TBA'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="text-[#555555]" size={18} />
                <span>{regCount} {event.max_capacity ? `/ ${event.max_capacity}` : ''} attending</span>
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="sticky top-24 rounded-2xl border border-[#e0e0e0] p-6 bg-white shadow-sm space-y-6">
              <div>
                <p className="font-mono text-sm text-[#555555] mb-3">{regCount} / {event.max_capacity || '∞'} registered</p>
                <div className="w-full h-1.5 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0a0a0a]" style={{ width: `${progressPct}%` }} />
                </div>
                {event.registration_deadline && (
                  <p className="font-mono text-xs text-[#999999] mt-3">Closes {new Date(event.registration_deadline).toLocaleDateString()}</p>
                )}
              </div>

              {/* Login Call To Action */}
              <div className="border border-dashed border-[#e0e0e0] rounded-xl p-5 bg-[#f9f9f9] text-center space-y-4">
                <p className="text-xs font-mono font-medium text-[#555555] leading-relaxed">
                  Register or RSVP for this event to secure your place.
                </p>
                <Link 
                  href={`/login?redirectTo=/student/events/${id}`}
                  className="block w-full py-3.5 bg-black hover:bg-zinc-800 text-white text-center font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-98"
                >
                  Login to RSVP
                </Link>
              </div>

              {/* Open in App + Download */}
              <div className="border-t border-[#e0e0e0] pt-5 space-y-2">
                <a
                  href={`intent://curdrice.nivet2006.in/events/${id}#Intent;scheme=https;package=com.clubeve.cc;S.browser_fallback_url=${encodeURIComponent(`https://curdrice.nivet2006.in/events/${id}`)};end`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] bg-[#0a0a0a] text-white hover:bg-zinc-800"
                >
                  <ExternalLink size={14} />
                  Open in ClubEve App
                </a>
                <a
                  href="https://github.com/Nivet2006/ClubEve-app/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold border border-[#e0e0e0] text-[#555555] transition-all active:scale-[0.98] hover:bg-zinc-50"
                >
                  <Download size={12} />
                  Don&apos;t have the app? Download
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
