import { createClient } from '@/lib/supabase/server'
import { RealtimeStaffCalendar } from '@/components/shared/RealtimeStaffCalendar'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ManagerCalendarPage() {
  const supabase = await createClient()

  // Manager sees all approved events campus-wide
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'approved')
    .order('event_date', { ascending: true })

  return (
    <RealtimeStaffCalendar
      initialEvents={(events || []) as Event[]}
      role="manager"
    />
  )
}
