import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CalendarDays, MapPin, Users, Clock, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/lib/types'
import { LocationMapEmbed } from '@/components/shared/LocationMapEmbed'
import { RegisterButton } from '@/components/student/RegisterButton'
import { registerForEvent } from '@/lib/actions/events'
import { QRButton } from '@/components/student/QRButton'
import { ShareEventButton } from '@/components/student/ShareEventButton'
import { withDynamicSingleEventStatus } from '@/lib/event-utils'
import { EventStatusBadge } from '@/components/ui/EventStatusBadge'
import { StudentFeedbackTerminal } from '@/components/student/StudentFeedbackTerminal'
import { EventThread } from '@/components/student/EventThread'
import { getEventThread } from '@/lib/actions/event-threads'
import { MessageSquare, Lock } from 'lucide-react'
import { parseCustomBackground } from '@/lib/custom-background'

export default async function EventDetailPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ invitedBy?: string }>
}) {
  const supabase = await createClient()
  const { id } = await params
  const { invitedBy } = await searchParams
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase.from('events').select('id, title, description, club_name, location, location_lat, location_lng, event_date, registration_deadline, max_capacity, waitlist_max, status, banner_url, custom_background, created_by, created_at, approval_status, discussion_enabled, feedback_open, feedback_config, is_public, targeted_department, rejection_data, is_compulsory').eq('id', id).single()
  const event = withDynamicSingleEventStatus(data as Event)

  if (!event) return <div>Event not found</div>

  // Run remaining queries in parallel
  const [activeRegCountRes, waitlistRegCountRes, profileRes, registrationRes, feedbackRes] = await Promise.all([
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('is_waitlisted', false),
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('is_waitlisted', true),
    supabase
      .from('profiles')
      .select('full_name, usn, role')
      .eq('id', user?.id)
      .single(),
    supabase
      .from('registrations')
      .select('id, event_id, student_id, qr_token, checked_in, checked_in_at, is_waitlisted, registered_at')
      .eq('event_id', id)
      .eq('student_id', user?.id)
      .maybeSingle(),
    supabase
      .from('feedbacks')
      .select('id')
      .eq('event_id', id)
      .eq('student_id', user?.id)
      .maybeSingle(),
  ])

  const activeCount = activeRegCountRes.count || 0
  const waitlistCount = waitlistRegCountRes.count || 0
  const profile = profileRes.data
  const registration = registrationRes.data
  const feedbackData = feedbackRes.data

  const isRegistered = !!registration
  const hasSubmittedFeedback = !!feedbackData
  const isEligible = true
  const maxCap = event.max_capacity || Infinity
  const progressPct = Math.min((activeCount / maxCap) * 100, 100)

  let waitlistPosition = 0
  if (registration && registration.is_waitlisted) {
    const { count: pos } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('is_waitlisted', true)
      .lte('registered_at', registration.registered_at)
    waitlistPosition = pos || 1
  }

  // Fetch event thread info
  const thread = event.discussion_enabled ? await getEventThread(id) : null

  return (
    <div className="w-full">
      <Link href="/student/events" className="inline-block font-mono text-sm text-[#555555] hover:text-[#0a0a0a] mb-6 transition-colors">
        ← Events
      </Link>

      {(() => {
        const bg = parseCustomBackground(event.custom_background, event.banner_url)
        return (
          <div 
            style={bg.containerStyle}
            className={`w-full aspect-[21/9] sm:aspect-[3/1] rounded-2xl mb-10 overflow-hidden relative flex items-end p-6 sm:p-10 ${bg.containerClass}`}
          >
            {/* Overlay for background images / gradient layers */}
            <div 
              style={bg.overlayStyle}
              className={`absolute inset-0 pointer-events-none ${bg.overlayClass}`}
            />
            
            {/* Banner Content Card */}
            <div className={`w-full max-w-xl p-6 rounded-2xl relative z-10 transition-all ${bg.glassClass} ${bg.textClass}`}>
              <div className="flex flex-wrap gap-2 items-center mb-3">
                <span className="border-[1.5px] border-current font-mono rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider bg-black/10 dark:bg-white/10">{event.club_name}</span>
                <EventStatusBadge status={event.status} className="px-2.5 py-0.5 text-[10px] rounded-full" />
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight uppercase leading-tight">{event.title}</h1>
            </div>
          </div>
        )
      })()}

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1">
          
          {/* Compulsory event banner */}
          {(event as any).is_compulsory && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800">
              <ShieldAlert size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Compulsory Event</p>
                <p className="text-xs text-rose-500 dark:text-rose-400 mt-0.5">You have been auto-registered for this event. Your QR code is available below.</p>
              </div>
            </div>
          )}
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
            {event.location_lat && event.location_lng && (
              <div className="mt-4">
                <LocationMapEmbed
                  lat={event.location_lat}
                  lng={event.location_lng}
                  name={event.location || 'Visit Location'}
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users className="text-[#555555]" size={18} />
              <span>{activeCount} {event.max_capacity ? `/ ${event.max_capacity}` : ''} attending {waitlistCount > 0 ? `(${waitlistCount} on waitlist)` : ''}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[320px] shrink-0">
          <div className="sticky top-24 rounded-2xl border border-[#e0e0e0] p-6 bg-white shadow-sm">
            {invitedBy && (
              <p className="font-mono text-[10px] uppercase tracking-tighter text-[#0a0a0a] mb-5 border-b pb-2">
                {invitedBy} invites you to join this event
              </p>
            )}
            <p className="font-mono text-sm text-[#555555] mb-3">{activeCount} / {event.max_capacity || '∞'} registered {waitlistCount > 0 ? `(${waitlistCount} on waitlist)` : ''}</p>
            <div className="w-full h-1.5 bg-[#f5f5f5] rounded-full overflow-hidden">
              <div className="h-full bg-[#0a0a0a]" style={{ width: `${progressPct}%` }} />
            </div>
            {event.registration_deadline && (
              <p className="font-mono text-xs text-[#999999] mt-3">Closes {new Date(event.registration_deadline).toLocaleDateString()}</p>
            )}

            {isRegistered ? (
              <div className="mt-6 space-y-4">
                {registration.is_waitlisted ? (
                  <Button className="w-full opacity-90 bg-amber-500 hover:bg-amber-600 text-white cursor-not-allowed">
                    Waitlisted (Position #{waitlistPosition})
                  </Button>
                ) : (
                  <>
                    <Button className="w-full opacity-50 cursor-not-allowed">Registered ✓</Button>
                    
                    <StudentFeedbackTerminal 
                      event={event} 
                      studentId={user?.id || ''} 
                      hasSubmitted={hasSubmittedFeedback} 
                    />

                    <QRButton 
                      token={registration?.qr_token || ''} 
                      studentName={profile?.full_name || ''} 
                      usn={profile?.usn || ''} 
                      eventName={event.title} 
                    />
                  </>
                )}
              </div>
            ) : isEligible ? (
               <div>
                 {event.max_capacity && activeCount >= event.max_capacity && (
                   <p className="text-xs font-mono text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
                     ⚠️ Event capacity reached. Registering will put you on the waitlist (max capacity: {event.waitlist_max}).
                   </p>
                 )}
                 <RegisterButton eventId={id} />
               </div>
            ) : (
              <div className="mt-6 border border-dashed border-[#e0e0e0] rounded-xl p-4 bg-[#f9f9f9]">
                <p className="text-xs font-mono text-[#555555]">You are not eligible for this event based on the current constraints.</p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-[#e0e0e0]">
              <ShareEventButton 
                eventId={id} 
                eventName={event.title} 
                clubName={event.club_name} 
                eventDate={event.event_date} 
                userId={user?.id || ''} 
                userRole={profile?.role || ''}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Discussion Thread */}
      {event.discussion_enabled && (
        <div className="mt-12">
          <h2 className="text-xl font-black text-[#0a0a0a] mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-[#5865F2]" />
            Discussion
          </h2>
          {isRegistered && thread ? (
            <EventThread
              conversationId={thread.id}
              eventName={event.title}
              userId={user?.id || ''}
              memberCount={thread.member_count}
              threadMode={thread.thread_mode}
              userRole={thread.user_role}
            />
          ) : isRegistered && !thread ? (
            <div className="rounded-2xl border border-dashed border-[#e0e0e0] p-8 text-center bg-[#f9f9f9]">
              <MessageSquare size={32} className="mx-auto text-[#999] mb-3" />
              <p className="font-mono text-sm text-[#555555]">Discussion thread is being set up. Check back soon!</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#e0e0e0] p-8 text-center bg-[#f9f9f9]">
              <Lock size={32} className="mx-auto text-[#999] mb-3" />
              <p className="font-mono text-sm text-[#555555]">Register for this event to join the discussion.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
