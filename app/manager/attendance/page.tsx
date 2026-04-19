import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { withDynamicEventStatus } from '@/lib/event-utils'
import { EventStatusBadge } from '@/components/ui/EventStatusBadge'
import type { Event as EventType } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ManagerAttendanceDirectory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })

  const baseEvents = withDynamicEventStatus((allEvents || []) as EventType[])
  const eventIds = baseEvents.map(e => e.id)

  const { data: rawRegistrations } = eventIds.length > 0
    ? await supabase.from('registrations').select('event_id').in('event_id', eventIds)
    : { data: [] }
    
  const registrations = rawRegistrations || []

  const events = baseEvents.map(event => ({
    ...event,
    registrations: [{ 
      count: registrations.filter(r => r.event_id === event.id).length 
    }]
  }))

  return (
    <div className="w-full pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a] mb-2">Attendance</h1>
          <p className="font-mono text-sm text-[#555555]">Select an event to view attendee list, monitor real-time check-ins, or issue manual overrides.</p>
        </div>
      </div>

      {events?.length === 0 ? (
          <p className="col-span-full font-mono text-xs text-[#999999] p-8 border border-dashed border-[#e0e0e0] rounded-2xl text-center">No events found. You have not created any events to manage.</p>
        ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(events || []).map((event) => (
          <Link key={event.id} href={`/manager/attendance/${event.id}`}>
            <Card className="p-6 h-full flex flex-col hover:border-[#0a0a0a] transition-all bg-white group cursor-pointer relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="font-mono text-xs text-[#0a0a0a] border border-[#0a0a0a] rounded-full px-2 py-0.5">{event.club_name}</div>
                <EventStatusBadge status={event.status} />
              </div>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-3 line-clamp-2">{event.title}</h3>

              <div className="mt-auto space-y-2 font-mono text-xs text-[#555555]">
                <div className="flex items-center gap-2"><CalendarDays size={14} />{new Date(event.event_date).toLocaleDateString()}</div>
                <div className="flex items-center gap-2"><MapPin size={14} />{event.location || 'TBA'}</div>
                <div className="flex items-center gap-2 text-[#0a0a0a] font-bold"><Users size={14} />{event.registrations?.[0]?.count || 0} Registered</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      )}
    </div>
  )
}
