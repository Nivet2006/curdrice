import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import CombinedSheetButton from '@/components/admin/CombinedSheetButton'
import { withDynamicEventStatus } from '@/lib/event-utils'
import { EventStatusBadge } from '@/components/ui/EventStatusBadge'
import type { Event as EventType } from '@/lib/types'

export default async function AdminAttendanceDirectory() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, registrations(count)')
    .order('event_date', { ascending: false })

  const processedEvents = withDynamicEventStatus((events || []) as EventType[])

  return (
    <div className="w-full pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a] mb-2">Attendance Portal</h1>
          <p className="font-mono text-sm text-[#555555]">Select an event to view attendee list, monitor real-time check-ins, or issue manual overrides.</p>
        </div>
        <CombinedSheetButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {processedEvents.map((event: any) => (
          <Link key={event.id} href={`/admin/attendance/${event.id}`}>
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
    </div>
  )
}
