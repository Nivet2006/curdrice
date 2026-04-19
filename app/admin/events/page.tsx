import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/student/EventCard'
import type { Event } from '@/lib/types'
import { withDynamicEventStatus } from '@/lib/event-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { DeleteEventButton } from '@/components/manager/DeleteEventButton'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const { data: allEvents } = await supabase
    .from('events')
    .select('*, registrations(count)')
    .order('event_date', { ascending: false })

  const events = withDynamicEventStatus((allEvents as (Event & { registrations: { count: number }[] })[]) || [])

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">All Events</h1>
          <p className="font-mono text-sm text-[#555555]">System-wide event oversight</p>
        </div>
        <Link href="/manager/events/create">
          <Button variant="primary" className="bg-[#0a0a0a] flex items-center gap-2">
            <Plus size={16} /> Create Event
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <p className="col-span-full font-mono text-xs text-[#999999] p-8 border border-dashed border-[#e0e0e0] rounded-2xl text-center">No events found in the system.</p>
        ) : (
          events.map((event) => {
            const count = event.registrations?.[0]?.count || 0
            return (
              <EventCard
                key={event.id}
                event={event}
                isEligible={true}
                hrefOverride={`/manager/events/${event.id}`}
                registeredCount={count}
                adminActions={
                  <DeleteEventButton
                    eventId={event.id}
                    eventTitle={event.title}
                    registrationCount={count}
                  />
                }
              />
            )
          })
        )}
      </div>
    </div>
  )
}
