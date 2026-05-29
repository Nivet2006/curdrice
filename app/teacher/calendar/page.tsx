import { createClient } from '@/lib/supabase/server'
import { RealtimeStaffCalendar } from '@/components/shared/RealtimeStaffCalendar'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TeacherCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('department')
    .eq('id', user!.id)
    .single()

  const dept = profile?.department || 'General'

  // Fetch all approved + pending events in teacher's department
  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at')
    .in('approval_status', ['approved', 'pending_hod'])
    .eq('targeted_department', dept)
    .order('event_date', { ascending: true })

  return (
    <RealtimeStaffCalendar
      initialEvents={(events || []) as Event[]}
      role="teacher"
    />
  )
}
