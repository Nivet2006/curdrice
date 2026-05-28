import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { CalendarDays, Clock, MapPin, Users, ExternalLink, Download } from 'lucide-react'
import type { Event } from '@/lib/types'

const APP_URL_BASE = 'https://curdrice.nivet2006.in'
const APK_DOWNLOAD_URL = 'https://github.com/Nivet2006/ClubEve-app/releases/latest'

export default async function PublicEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const { data: event } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('approval_status', 'approved')
    .single()

  if (!event) return notFound()

  const e = event as Event

  const { count: regCount } = await supabaseAdmin
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  const intentUri = `intent://${APP_URL_BASE.replace('https://', '')}/events/${eventId}#Intent;scheme=https;package=com.clubeve.cc;S.browser_fallback_url=${encodeURIComponent(`${APP_URL_BASE}/events/${eventId}`)};end`

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header badge */}
        <div className="flex items-center gap-2 mb-6">
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border"
            style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
          >
            Club-Eve Event
          </span>
        </div>

        {/* Banner */}
        <div
          className="w-full aspect-[3/1] rounded-2xl overflow-hidden mb-8 border"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
        >
          {e.banner_url ? (
            <img src={e.banner_url} alt={e.title} className="w-full h-full object-cover grayscale" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-mono text-xs" style={{ color: 'var(--fg-muted)' }}>
              NO BANNER
            </div>
          )}
        </div>

        {/* Club + status */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className="font-mono text-xs font-bold px-3 py-1 rounded-full border"
            style={{ borderColor: 'var(--fg)', color: 'var(--fg)' }}
          >
            {e.club_name}
          </span>
          <span
            className="font-mono text-xs px-3 py-1 rounded-full border capitalize"
            style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
          >
            {e.status}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black mb-4 leading-tight" style={{ color: 'var(--fg)' }}>
          {e.title}
        </h1>

        {/* Description */}
        {e.description && (
          <p className="text-base leading-relaxed mb-8 whitespace-pre-wrap" style={{ color: 'var(--fg-muted)' }}>
            {e.description}
          </p>
        )}

        {/* Details grid */}
        <div
          className="rounded-2xl border p-5 mb-8 space-y-4 font-mono text-sm"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
        >
          <div className="flex items-center gap-3">
            <CalendarDays size={18} style={{ color: 'var(--fg-muted)' }} />
            <span>{new Date(e.event_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={18} style={{ color: 'var(--fg-muted)' }} />
            <span>{new Date(e.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={18} style={{ color: 'var(--fg-muted)' }} />
            <span>{e.location || 'TBA'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users size={18} style={{ color: 'var(--fg-muted)' }} />
            <span>{regCount || 0}{e.max_capacity ? ` / ${e.max_capacity}` : ''} registered</span>
          </div>
          {e.registration_deadline && (
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                Registration closes {new Date(e.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {/* Open in App button */}
        <a
          href={intentUri}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] mb-3"
          style={{
            background: 'var(--fg)',
            color: 'var(--bg)',
          }}
        >
          <ExternalLink size={16} />
          Open in ClubEve App
        </a>

        {/* Download APK fallback */}
        <a
          href={APK_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold border transition-all active:scale-[0.98] mb-6"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--fg-muted)',
          }}
        >
          <Download size={16} />
          Don&apos;t have the app? Download ClubEve
        </a>

        {/* Footer */}
        <div
          className="text-center font-mono text-[10px] uppercase tracking-widest pt-6 border-t"
          style={{ color: 'var(--fg-muted)', borderColor: 'var(--border)' }}
        >
          Powered by Club-Eve
        </div>
      </div>
    </div>
  )
}
