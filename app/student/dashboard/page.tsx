import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/student/EventCard'
import { RealtimeDashboard } from '@/components/student/RealtimeDashboard'
import type { Event } from '@/lib/types'
import { withDynamicEventStatus } from '@/lib/event-utils'
import { Radio } from 'lucide-react'
import Link from 'next/link'
import { EasterEggBADGE } from '@/components/student/EasterEggBADGE'

export default async function StudentDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('event_id, qr_token, events(*)')
    .eq('student_id', user?.id)

  const registeredEvents = withDynamicEventStatus((registrations || []).map(r => r.events as unknown as Event).filter(Boolean))

  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })

  const dynamicEvents = withDynamicEventStatus((allEvents as Event[]) || [])
  const events = dynamicEvents.filter(e => e.status === 'upcoming').slice(0, 6)

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">
            Welcome, {profile?.full_name}
          </h1>
          <p className="font-mono text-sm text-[#555555]">{profile?.usn}</p>
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
        <h2 className="flex items-center gap-3 text-xl font-bold mb-6 text-[#0a0a0a]">
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
          profile={profile}
        />
      </div>
    </div>
  )
}