import { createClient } from '@/lib/supabase/server'
import type { Event } from '@/lib/types'
import { withDynamicEventStatus } from '@/lib/event-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { AdminEventList } from '@/components/admin/AdminEventList'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const { data: allEvents } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at, registrations(count)')
    .order('event_date', { ascending: false })
    .limit(100)

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

      <AdminEventList events={events} />
    </div>
  )
}
