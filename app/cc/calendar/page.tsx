import { createClient, getCachedAuthUser } from '@/lib/supabase/server'
import { RealtimeStaffCalendar } from '@/components/shared/RealtimeStaffCalendar'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CCCalendarPage() {
  const supabase = await createClient()
  const user = await getCachedAuthUser()

  // CC sees all approved events campus-wide (their own events + others)
  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at')
    .eq('approval_status', 'approved')
    .order('event_date', { ascending: true })

  return (
    <RealtimeStaffCalendar
      initialEvents={(events || []) as Event[]}
      role="cc"
    />
  )
}
