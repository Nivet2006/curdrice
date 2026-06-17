import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CalendarDays, MapPin, Users, Clock, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/lib/types'
import { LocationMapEmbed } from '@/components/shared/LocationMapEmbed'
import { RegisterButton } from '@/components/student/RegisterButton'
import { CancelRegistrationButton } from '@/components/student/CancelRegistrationButton'
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
import { TeamFormationPortal } from '@/components/student/TeamFormationPortal'
import { HackathonConfigPanel } from '@/components/student/HackathonConfigPanel'

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

  const { data } = await supabase.from('events').select('id, title, description, club_name, location, location_lat, location_lng, event_date, registration_deadline, max_capacity, waitlist_max, status, banner_url, custom_background, created_by, created_at, approval_status, discussion_enabled, feedback_open, feedback_config, is_public, targeted_department, rejection_data, is_compulsory, event_type, team_formation_enabled, min_team_members, max_team_members, registration_stopped, hackathon_criteria, show_evaluation_criteria, show_scoreboard, profiles:created_by(role, full_name)').eq('id', id).single()
  const event = withDynamicSingleEventStatus(data as Event)

  if (!event) return <div>Event not found</div>

  const isCreator = user?.id === event.created_by

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

  const bg = parseCustomBackground(event.custom_background, event.banner_url)

  return (
    <div className={`w-full min-h-screen relative transition-all ${bg.textClass}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        [data-theme='dark'] .custom-bg-backdrop {
          background-color: #000000 !important;
          background-image: none !important;
        }
        [data-theme='dark'] .custom-bg-card {
          background-color: #0a0a0a !important;
          border-color: #27272a !important;
          color: #ffffff !important;
        }
      `}} />
      {bg.customStyleBlock && <style dangerouslySetInnerHTML={{ __html: bg.customStyleBlock }} />}
      {bg.hasCustomBg && (
        <>
          <div 
            style={bg.backdropStyle} 
            className={`fixed inset-0 w-full h-full -z-10 pointer-events-none transition-all custom-bg-backdrop ${bg.backdropClass}`} 
          />
          {bg.backdropOverlayClass && (
            <div 
              style={bg.backdropOverlayStyle} 
              className={`fixed inset-0 w-full h-full -z-10 pointer-events-none transition-all ${bg.backdropOverlayClass}`} 
            />
          )}
          {bg.meshPatternStyle && (
            <div 
              style={bg.meshPatternStyle} 
              className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-80" 
            />
          )}
        </>
      )}
      
      <div className="relative z-10">
        <Link href="/student/events" className={`inline-block font-mono text-sm mb-6 transition-colors ${bg.linkClass}`}>
          ← Events
        </Link>



        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-8">
            <div className={`${bg.cardClass} custom-bg-card`} style={bg.cardStyle}>
              <div className="flex gap-3 mb-4 flex-wrap">
                {event.event_type === 'hackathon' && (
                  <span className="border-[1.5px] border-violet-500 text-violet-600 dark:text-violet-400 font-mono rounded-full px-3 py-1 text-xs bg-violet-500/10 uppercase tracking-wider font-bold">
                    🚀 Hackathon
                  </span>
                )}
                <span className="border-[1.5px] border-current font-mono rounded-full px-3 py-1 text-xs bg-black/10 dark:bg-white/10">
                  {(() => {
                    const creator = event.profiles ? (Array.isArray(event.profiles) ? event.profiles[0] : event.profiles) : null;
                    if (event.club_name === 'Others' && creator?.role === 'teacher' && creator?.full_name) {
                      return `By: ${creator.full_name}`;
                    }
                    return event.club_name;
                  })()}
                </span>
                <EventStatusBadge status={event.status} className="px-3 py-1 text-xs rounded-full" />
              </div>
              
              <h1 className="text-3xl font-black mb-6 uppercase tracking-tight">{event.title}</h1>
              
              {/* Compulsory event banner */}
              {(event as any).is_compulsory && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50/15 dark:bg-rose-950/20 rounded-2xl border border-rose-500/20">
                  <ShieldAlert size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-rose-500">Compulsory Event</p>
                    <p className="text-xs opacity-90 mt-0.5">You have been auto-registered for this event. Your QR code is available below.</p>
                  </div>
                </div>
              )}
              
              <p className="text-base leading-relaxed whitespace-pre-wrap opacity-95">{event.description}</p>
            </div>

            <div className={`${bg.cardClass} custom-bg-card`} style={bg.cardStyle}>
              <h3 className="font-bold text-lg mb-4 uppercase tracking-tight">Details</h3>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex items-center gap-3">
                  <CalendarDays size={18} />
                  <span>{new Date(event.event_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} />
                  <span>{new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} />
                  <span>{event.location || 'TBA'}</span>
                </div>
                {event.location_lat && event.location_lng && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    <LocationMapEmbed
                      lat={event.location_lat}
                      lng={event.location_lng}
                      name={event.location || 'Visit Location'}
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Users size={18} />
                  <span>{activeCount} {event.max_capacity ? `/ ${event.max_capacity}` : ''} attending {waitlistCount > 0 ? `(${waitlistCount} on waitlist)` : ''}</span>
                </div>
              </div>
            </div>
            
            {event.event_type === 'hackathon' && isCreator && (
              <HackathonConfigPanel
                eventId={id}
                initialCriteria={event.hackathon_criteria as any}
                initialShowCriteria={event.show_evaluation_criteria ?? true}
                initialShowScoreboard={event.show_scoreboard ?? false}
                cardClass={bg.cardClass}
                cardStyle={bg.cardStyle}
              />
            )}

            {event.event_type === 'hackathon' && event.team_formation_enabled && isRegistered && (
              <div className={`${bg.cardClass} custom-bg-card overflow-hidden`} style={bg.cardStyle}>
                <div className="flex items-center justify-between mb-6 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
                  <h3 className="font-bold text-lg uppercase tracking-tight">🏆 Hackathon Team Portal</h3>
                  <a
                    href={`/student/events/${id}/showcase`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all"
                  >
                    🏆 View Showcase & Scores
                  </a>
                </div>
                <div className="mt-4">
                  <TeamFormationPortal eventId={id} currentUserId={user?.id || ''} />
                </div>
              </div>
            )}

            {event.event_type === 'hackathon' && isRegistered && (event.show_scoreboard || isCreator) && (
              <div className={`${bg.cardClass} custom-bg-card overflow-hidden`} style={bg.cardStyle}>
                <div className="flex justify-between items-center mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <h3 className="font-bold text-lg uppercase tracking-tight">🏆 Scoreboard</h3>
                  {isCreator && !event.show_scoreboard && (
                    <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 font-bold border border-rose-500/20 px-2 py-0.5 rounded-full bg-rose-500/5">
                      Hidden from students
                    </span>
                  )}
                </div>
                <div className="p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center bg-zinc-50/50 dark:bg-zinc-900/20">
                  <p className="font-mono text-xs uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mb-1">Scores not yet published</p>
                  <p className="text-xs text-zinc-400">Judges are still evaluating.</p>
                </div>
              </div>
            )}

            {event.event_type === 'hackathon' && isRegistered && (event.show_evaluation_criteria !== false || isCreator) && (
              <div className={`${bg.cardClass} custom-bg-card overflow-hidden`} style={bg.cardStyle}>
                <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <h3 className="font-bold text-lg uppercase tracking-tight">📊 Evaluation Criteria</h3>
                  {isCreator && event.show_evaluation_criteria === false && (
                    <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 font-bold border border-rose-500/20 px-2 py-0.5 rounded-full bg-rose-500/5">
                      Hidden from students
                    </span>
                  )}
                </div>
                <div className="space-y-4 font-mono text-xs uppercase tracking-wider">
                  {Array.isArray(event.hackathon_criteria) && event.hackathon_criteria.length > 0 ? (
                    (event.hackathon_criteria as any[]).map((crit, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                        <span className="text-zinc-500 font-bold">{crit.name}</span>
                        <span className="font-black text-zinc-900 dark:text-zinc-100">{crit.max_points} pts</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                        <span className="text-zinc-500 font-bold">Innovation</span>
                        <span className="font-black text-zinc-900 dark:text-zinc-100">20 pts</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                        <span className="text-zinc-500 font-bold">Technical</span>
                        <span className="font-black text-zinc-900 dark:text-zinc-100">20 pts</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                        <span className="text-zinc-500 font-bold">Design/UX</span>
                        <span className="font-black text-zinc-900 dark:text-zinc-100">20 pts</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                        <span className="text-zinc-500 font-bold">Presentation</span>
                        <span className="font-black text-zinc-900 dark:text-zinc-100">20 pts</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 font-black text-sm text-zinc-900 dark:text-zinc-100">
                    <span>Total</span>
                    <span>
                      {Array.isArray(event.hackathon_criteria) && event.hackathon_criteria.length > 0
                        ? (event.hackathon_criteria as any[]).reduce((sum, c) => sum + (c.max_points || 0), 0)
                        : 80} pts
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[320px] shrink-0 space-y-6">
            {event.banner_url && (
              <div className="rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg bg-black/[0.02] dark:bg-white/[0.02]">
                <img src={event.banner_url} alt={event.title} className="w-full h-auto object-contain" />
              </div>
            )}
            <div className={`sticky top-24 ${bg.cardClass} custom-bg-card`} style={bg.cardStyle}>
              {invitedBy && (
                <p className="font-mono text-[10px] uppercase tracking-tighter mb-5 border-b border-current/20 pb-2">
                  {invitedBy} invites you to join this event
                </p>
              )}
              <p className="font-mono text-sm mb-3">{activeCount} / {event.max_capacity || '∞'} registered {waitlistCount > 0 ? `(${waitlistCount} on waitlist)` : ''}</p>
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-current" style={{ width: `${progressPct}%` }} />
              </div>
              {event.registration_stopped ? (
                <p className="font-mono text-xs text-rose-500 font-bold mt-3">Registrations stopped by organizer</p>
              ) : event.registration_deadline ? (
                <p className="font-mono text-xs opacity-70 mt-3">Closes {new Date(event.registration_deadline).toLocaleDateString()}</p>
              ) : null}

              {(() => {
                const isRegistrationsClosed = !!event.registration_stopped || (event.registration_deadline ? new Date() > new Date(event.registration_deadline) : false);
                if (isRegistered) {
                  return (
                    <div className="mt-6 space-y-4">
                      {registration.is_waitlisted ? (
                        <>
                          <Button className="w-full opacity-90 bg-amber-500 hover:bg-amber-600 text-white cursor-not-allowed">
                            Waitlisted (Position #{waitlistPosition})
                          </Button>
                          {event.is_compulsory !== true && <CancelRegistrationButton eventId={id} />}
                        </>
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

                          {event.is_compulsory !== true && <CancelRegistrationButton eventId={id} />}
                        </>
                      )}
                    </div>
                  );
                } else if (isRegistrationsClosed) {
                  return (
                    <div className="mt-6 border border-dashed border-rose-500/35 rounded-xl p-4 bg-rose-500/5">
                      <p className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold text-center">Registrations Closed / Stopped</p>
                    </div>
                  );
                } else if (isEligible) {
                  return (
                    <div>
                      {event.max_capacity && activeCount >= event.max_capacity && (
                        <p className="text-xs font-mono text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
                          ⚠️ Event capacity reached. Registering will put you on the waitlist (max capacity: {event.waitlist_max}).
                        </p>
                      )}
                      <RegisterButton eventId={id} />
                    </div>
                  );
                } else {
                  return (
                    <div className="mt-6 border border-dashed border-current/25 rounded-xl p-4 bg-white/5">
                      <p className="text-xs font-mono opacity-80">You are not eligible for this event based on the current constraints.</p>
                    </div>
                  );
                }
              })()}
              
              <div className="mt-4 pt-4 border-t border-current/10">
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
            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${bg.textClass}`}>
              <MessageSquare size={20} className="text-[#5865F2]" />
              Discussion
            </h2>
            {isRegistered && thread ? (
              <div className={bg.cardClass + " !p-0 overflow-hidden"} style={bg.cardStyle}>
                <EventThread
                  conversationId={thread.id}
                  eventName={event.title}
                  userId={user?.id || ''}
                  memberCount={thread.member_count}
                  threadMode={thread.thread_mode}
                  userRole={thread.user_role}
                />
              </div>
            ) : isRegistered && !thread ? (
              <div className="rounded-2xl border border-dashed border-[#e0e0e0] dark:border-zinc-800 p-8 text-center bg-zinc-50 dark:bg-zinc-900/30">
                <MessageSquare size={32} className="mx-auto text-[#999] mb-3" />
                <p className="font-mono text-sm text-[#555555] dark:text-zinc-400">Discussion thread is being set up. Check back soon!</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#e0e0e0] dark:border-zinc-800 p-8 text-center bg-zinc-50 dark:bg-zinc-900/30">
                <Lock size={32} className="mx-auto text-[#999] mb-3" />
                <p className="font-mono text-sm text-[#555555] dark:text-zinc-400">Register for this event to join the discussion.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
