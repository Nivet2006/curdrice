import { createClient } from '@/lib/supabase/server'
import { RealtimeStaffCalendar } from '@/components/shared/RealtimeStaffCalendar'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HODCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('department')
    .eq('id', user!.id)
    .single()

  const dept = profile?.department || 'General'

  // Fetch all approved events in HOD's department
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'approved')
    .eq('targeted_department', dept)
    .order('event_date', { ascending: true })

  return (
    <RealtimeStaffCalendar
      initialEvents={(events || []) as Event[]}
      role="hod"
    />
  )
}
