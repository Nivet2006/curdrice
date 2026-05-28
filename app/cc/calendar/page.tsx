import { createClient } from '@/lib/supabase/server'
import { RealtimeStaffCalendar } from '@/components/shared/RealtimeStaffCalendar'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CCCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // CC sees all approved events campus-wide (their own events + others)
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'approved')
    .order('event_date', { ascending: true })

  return (
    <RealtimeStaffCalendar
      initialEvents={(events || []) as Event[]}
      role="cc"
    />
  )
}
