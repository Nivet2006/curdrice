import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Users, CheckCircle, Percent, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { withDynamicEventStatus } from '@/lib/event-utils'
import { EventStatusBadge } from '@/components/ui/EventStatusBadge'
import type { Event as EventType } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ManagerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Query 1: just events (no nested join)
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, club_name, location, event_date, registration_deadline, max_capacity, status, banner_url, approval_status, created_by, created_at, discussion_enabled')
    .order('event_date', { ascending: false })

  console.log('DEBUG DASHBOARD - EVENTS ERROR:', eventsError)
  console.log('DEBUG DASHBOARD - EVENTS DATA LENGTH:', events?.length)
  console.log('DEBUG DASHBOARD - USER ID:', user?.id)

  const myEvents = withDynamicEventStatus((events || []) as EventType[])
  const eventIds = myEvents.map(e => e.id)

  // Query 2: registrations separately (avoids RLS join issue)
  const { data: registrations, error: registrationsError } = eventIds.length > 0
    ? await supabase
        .from('registrations')
        .select('id, event_id, checked_in')
        .in('event_id', eventIds)
    : { data: [], error: null }

  console.log('DEBUG DASHBOARD - REGISTRATIONS ERROR:', registrationsError)
  console.log('DEBUG DASHBOARD - REGISTRATIONS DATA:', JSON.stringify(registrations, null, 2))

  const regs = registrations || []

  const totalEvents = myEvents.length
  const totalRegistrations = regs.length
  const totalCheckedIn = regs.filter(r => r.checked_in).length
  const attendanceRate = totalRegistrations > 0
    ? Math.round((totalCheckedIn / totalRegistrations) * 100)
    : 0

  return (
    <div className="w-full">
      <div className="mb-12">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">Dashboard</h1>
        <p className="font-mono text-sm text-[#555555]">Overview of your events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <CalendarDays className="text-[#999999] float-right" size={20} />
          <h3 className="text-4xl font-black mt-3 tracking-tight text-[#0a0a0a]">{totalEvents}</h3>
          <p className="font-mono text-xs text-[#555555] uppercase tracking-widest mt-1">Total Events</p>
        </div>
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <Users className="text-[#999999] float-right" size={20} />
          <h3 className="text-4xl font-black mt-3 tracking-tight text-[#0a0a0a]">{totalRegistrations}</h3>
          <p className="font-mono text-xs text-[#555555] uppercase tracking-widest mt-1">Registrations</p>
        </div>
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <CheckCircle className="text-[#999999] float-right" size={20} />
          <h3 className="text-4xl font-black mt-3 tracking-tight text-[#0a0a0a]">{totalCheckedIn}</h3>
          <p className="font-mono text-xs text-[#555555] uppercase tracking-widest mt-1">Attendance</p>
        </div>
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <Percent className="text-[#999999] float-right" size={20} />
          <h3 className="text-4xl font-black mt-3 tracking-tight text-[#0a0a0a]">{attendanceRate}%</h3>
          <p className="font-mono text-xs text-[#555555] uppercase tracking-widest mt-1">Attendance Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link href="/manager/events" className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
          <h3 className="text-xl font-bold text-[#0a0a0a]">Manage Events</h3>
          <p className="font-mono text-sm text-[#555555] mt-1">Create, edit, delete events</p>
        </Link>
        <Link href="/manager/scanner" className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
          <h3 className="text-xl font-bold text-[#0a0a0a]">QR Scanner</h3>
          <p className="font-mono text-sm text-[#555555] mt-1">Check-in students</p>
        </Link>
        <Link href="/manager/attendance" className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
          <h3 className="text-xl font-bold text-[#0a0a0a]">Attendance</h3>
          <p className="font-mono text-sm text-[#555555] mt-1">Download lists & reports</p>
        </Link>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-bold text-[#0a0a0a]">Recent Events</h2>
          <Link href="/manager/events" className="font-mono text-sm text-[#555555] hover:text-[#0a0a0a] transition-colors">View All →</Link>
        </div>
        
        {myEvents.length === 0 ? (
          <div className="border border-dashed border-[#e0e0e0] rounded-2xl p-12 text-center text-[#555555] font-mono text-sm">
            <p>No events found.</p>
            <Link href="/manager/events/create" className="inline-block mt-4 text-[#0a0a0a] underline">Create your first event</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.slice(0, 5).map(event => {
              const count = regs.filter((r: any) => r.event_id === event.id).length
              return (
                <Link key={event.id} href={`/manager/events/${event.id}`}>
                  <Card className="p-6 h-full flex flex-col hover:border-[#0a0a0a] transition-all bg-white group cursor-pointer relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      {event.club_name ? (
                        <div className="font-mono text-xs text-[#0a0a0a] border border-[#0a0a0a] rounded-full px-2 py-0.5">{event.club_name}</div>
                      ) : (
                        <div></div>
                      )}
                      <EventStatusBadge status={event.status} />
                    </div>
                    <h3 className="text-lg font-bold text-[#0a0a0a] mb-3 line-clamp-2">{event.title}</h3>

                    <div className="mt-auto space-y-2 font-mono text-xs text-[#555555]">
                      <div className="flex items-center gap-2"><CalendarDays size={14} />{new Date(event.event_date).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2"><MapPin size={14} />{event.location || 'TBA'}</div>
                      <div className="flex items-center gap-2 text-[#0a0a0a] font-bold"><Users size={14} />{count} Registered</div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
