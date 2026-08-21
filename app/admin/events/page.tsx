import { createClient } from '@/lib/supabase/server'
import type { Event } from '@/lib/types'
import { withDynamicEventStatus } from '@/lib/event-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { AdminEventList } from '@/components/admin/AdminEventList'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const { data: allEvents } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at, registrations(count)')
    .order('event_date', { ascending: false })
    .limit(100)

  const events = withDynamicEventStatus((allEvents as (Event & { registrations: { count: number }[] })[]) || [])

  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        breadcrumbs={[{ label: 'Events' }, { label: 'All Events' }]}
        title="All Events"
        subtitle={`System-wide event oversight. Total ${events.length} campus events.`}
        actions={
          <Link href="/teacher/events/create">
            <Button variant="primary" className="bg-[var(--fg)] text-[var(--bg)] flex items-center gap-2">
              <Plus size={16} /> Create Event
            </Button>
          </Link>
        }
      />

      <AdminEventList events={events} />
    </div>
  )
}
