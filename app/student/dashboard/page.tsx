import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/student/EventCard'
import { RealtimeDashboard } from '@/components/student/RealtimeDashboard'
import type { Event } from '@/lib/types'
import { withDynamicEventStatus } from '@/lib/event-utils'
import { Radio } from 'lucide-react'
import Link from 'next/link'
import { EasterEggBADGE } from '@/components/student/EasterEggBADGE'
import { GamificationSection } from '@/components/student/GamificationSection'
import { getUserGamificationData, getLeaderboard } from '@/lib/actions/gamification-actions'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const eventColumns = 'id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, banner_url, approval_status, discussion_enabled, thread_mode, created_by, created_at, feedback_open, is_public'

  // Run all queries in parallel
  const [profileRes, registrationsRes, allEventsRes, gamificationData, leaderboardData] = await Promise.all([
    supabase.from('profiles').select('id, full_name, usn, department, semester, year, username, role').eq('id', user?.id).single(),
    supabase
      .from('registrations')
      .select(`event_id, qr_token, is_waitlisted, events(${eventColumns})`)
      .eq('student_id', user?.id),
    supabase
      .from('events')
      .select(eventColumns)
      .eq('approval_status', 'approved')
      .order('event_date', { ascending: true }),
    getUserGamificationData(user?.id || ''),
    getLeaderboard()
  ])

  const profile = profileRes.data
  const registrations = registrationsRes.data
  const allEvents = allEventsRes.data

  const registeredEvents = withDynamicEventStatus((registrations || []).map(r => r.events as unknown as Event).filter(Boolean))

  const dynamicEvents = withDynamicEventStatus((allEvents as Event[]) || [])
  const events = dynamicEvents.filter(e => e.status === 'upcoming')

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-[#0a0a0a] uppercase">
            Welcome, {profile?.full_name}
          </h1>
          <p className="font-mono text-sm text-[#555555] uppercase tracking-widest">{profile?.usn}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <span className="bg-[#f5f5f5] px-3 py-1 font-mono text-xs text-[#999999] rounded-full border border-[#e0e0e0]">{profile?.department}</span>
            <span className="bg-[#f5f5f5] px-3 py-1 font-mono text-xs text-[#999999] rounded-full border border-[#e0e0e0]">Sem {profile?.semester}</span>
            <span className="bg-[#f5f5f5] px-3 py-1 font-mono text-xs text-[#999999] rounded-full border border-[#e0e0e0]">Year {profile?.year}</span>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="flex items-center gap-3 text-xl font-black mb-6 text-[#0a0a0a] uppercase tracking-tight">
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
          <div className="flex gap-6 overflow-x-auto pb-4">
            {registeredEvents.map((event) => {
              const reg = registrations?.find(r => r.event_id === event.id)
              if (!event || !reg) return null
              return (
                <div key={event.id} className="min-w-[300px] w-[350px]">
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

      <div className="mb-12">
        <GamificationSection
          currentUserId={user?.id || ''}
          points={gamificationData.points}
          rank={gamificationData.rank}
          history={gamificationData.history as any}
          badges={gamificationData.badges as any}
          leaderboard={(leaderboardData.leaderboard || []) as any}
        />
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