import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/student/EventCard'
import { RealtimeDashboard } from '@/components/student/RealtimeDashboard'
import type { Event } from '@/lib/types'
import { withDynamicEventStatus } from '@/lib/event-utils'
import { Radio } from 'lucide-react'
import Link from 'next/link'
import { EasterEggBADGE } from '@/components/student/EasterEggBADGE'
import { ClubShowcaseBar } from '@/components/shared/ClubShowcaseBar'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const eventColumns = 'id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, banner_url, approval_status, discussion_enabled, thread_mode, created_by, created_at, feedback_open, is_public'

  // Run all queries in parallel
  const [profileRes, registrationsRes, allEventsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, usn, department, semester, year, username, role').eq('id', user?.id).single(),
    supabase
      .from('registrations')
      .select(`event_id, qr_token, is_waitlisted, events(${eventColumns}, profiles:created_by(role, full_name))`)
      .eq('student_id', user?.id),
    supabase
      .from('events')
      .select(`${eventColumns}, profiles:created_by(role, full_name)`)
      .eq('approval_status', 'approved')
      .order('event_date', { ascending: true }),
  ])

  const profile = profileRes.data
  const registrations = registrationsRes.data
  const allEvents = allEventsRes.data

  const registeredEvents = withDynamicEventStatus((registrations || []).map(r => r.events as unknown as Event).filter(Boolean))

  const dynamicEvents = withDynamicEventStatus((allEvents as Event[]) || [])
  const events = dynamicEvents.filter(e => e.status === 'upcoming')

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 text-[#0a0a0a] uppercase">
            Welcome, {profile?.full_name}
          </h1>
          <p className="font-mono text-xs md:text-sm text-[#555555] uppercase tracking-widest">{profile?.usn}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="bg-[#f5f5f5] px-3 py-1 font-mono text-xs text-[#999999] rounded-full border border-[#e0e0e0]">{profile?.department}</span>
            <span className="bg-[#f5f5f5] px-3 py-1 font-mono text-xs text-[#999999] rounded-full border border-[#e0e0e0]">Sem {profile?.semester}</span>
            <span className="bg-[#f5f5f5] px-3 py-1 font-mono text-xs text-[#999999] rounded-full border border-[#e0e0e0]">Year {profile?.year}</span>
          </div>
        </div>
      </div>

      {/* Campus Club Showcases Bar */}
      <ClubShowcaseBar />

      <div className="mb-6 md:mb-12">
        <h2 className="flex items-center gap-3 text-lg md:text-xl font-black mb-4 sm:mb-6 text-[#0a0a0a] uppercase tracking-tight">
          You're Going
          <EasterEggBADGE>
            <span className="bg-[#0a0a0a] text-white font-mono text-xs px-2 py-0.5 rounded-full cursor-default">
              {registeredEvents.length}
            </span>
          </EasterEggBADGE>
        </h2>

        {registeredEvents.length === 0 ? (
          <p className="font-mono text-xs text-[#999999] p-8 border border-dashed border-[#e0e0e0] rounded-2xl text-center">No registered events yet.</p>
        ) : (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
            {registeredEvents.map((event) => {
              const reg = registrations?.find(r => r.event_id === event.id)
              if (!event || !reg) return null
              return (
                <div key={event.id} className="min-w-[260px] sm:min-w-[300px] w-[260px] sm:w-[350px] shrink-0">
                  <EventCard
                    event={event}
                    isRegistered={true}
                    isWaitlisted={reg.is_waitlisted}
                    qrToken={reg.qr_token}
                    studentName={profile?.full_name}
                    usn={profile?.usn}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <RealtimeDashboard
          initialEvents={events}
          registrations={registrations || []}
          profile={profile as any}
        />
      </div>
    </div>
  )
}