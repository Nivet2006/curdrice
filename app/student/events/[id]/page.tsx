import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CalendarDays, MapPin, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/lib/types'
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

  const { data } = await supabase.from('events').select('*').eq('id', id).single()
  const event = withDynamicSingleEventStatus(data as Event)

  if (!event) return <div>Event not found</div>

  const { count: registeredCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, usn, role')
    .eq('id', user?.id)
    .single()

  const { data: registration } = await supabase
    .from('registrations')
    .select('*')
    .eq('event_id', id)
    .eq('student_id', user?.id)
    .maybeSingle()

  const { data: feedbackData } = await supabase
    .from('feedbacks')
    .select('id')
    .eq('event_id', id)
    .eq('student_id', user?.id)
    .maybeSingle()

  const isRegistered = !!registration
  const hasSubmittedFeedback = !!feedbackData
  const isEligible = true
  const regCount = registeredCount || 0
  const maxCap = event.max_capacity || Infinity
  const progressPct = Math.min((regCount / maxCap) * 100, 100)

  // Fetch event thread info
  const thread = event.discussion_enabled ? await getEventThread(id) : null

  return (
    <div className="w-full">
      <Link href="/student/events" className="inline-block font-mono text-sm text-[#555555] hover:text-[#0a0a0a] mb-6 transition-colors">
        ← Events
      </Link>

      <div className="w-full aspect-[3/1] rounded-2xl bg-[#f5f5f5] mb-10 overflow-hidden relative border border-[#e0e0e0]">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover grayscale" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono text-[#999] text-xs">NO BANNER</div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
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

        <div className="w-full lg:w-[320px] shrink-0">
          <div className="sticky top-24 rounded-2xl border border-[#e0e0e0] p-6 bg-white shadow-sm">
            {invitedBy && (
              <p className="font-mono text-[10px] uppercase tracking-tighter text-[#0a0a0a] mb-5 border-b pb-2">
                {invitedBy} invites you to join this event
              </p>
            )}
            <p className="font-mono text-sm text-[#555555] mb-3">{regCount} / {event.max_capacity || '∞'} registered</p>
            <div className="w-full h-1.5 bg-[#f5f5f5] rounded-full overflow-hidden">
              <div className="h-full bg-[#0a0a0a]" style={{ width: `${progressPct}%` }} />
            </div>
            {event.registration_deadline && (
              <p className="font-mono text-xs text-[#999999] mt-3">Closes {new Date(event.registration_deadline).toLocaleDateString()}</p>
            )}

            {isRegistered ? (
              <div className="mt-6 space-y-4">
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
              </div>
            ) : isEligible ? (
               <RegisterButton eventId={id} />
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
