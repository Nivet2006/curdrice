import { createClient } from '@/lib/supabase/server'
import { RealtimeStaffCalendar } from '@/components/shared/RealtimeStaffCalendar'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ManagerCalendarPage() {
  const supabase = await createClient()

  // Manager sees all approved events campus-wide
  const { data: events } = await supabase
    .from('events')
    .select('id, title, club_name, event_date, location, status, banner_url, approval_status, max_capacity, registration_deadline')
    .eq('approval_status', 'approved')
    .order('event_date', { ascending: true })

  return (
    <RealtimeStaffCalendar
      initialEvents={(events || []) as Event[]}
      role="manager"
    />
  )
}
