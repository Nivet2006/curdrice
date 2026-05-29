import { createClient } from '@/lib/supabase/server'
import { RealtimeCalendarView } from '@/components/student/RealtimeCalendarView'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function StudentCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Run all queries in parallel
  const [allEventsRes, profileRes, registrationsRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, club_name, event_date, location, status, banner_url, approval_status, max_capacity, registration_deadline')
      .eq('approval_status', 'approved')
      .order('event_date', { ascending: true }),
    supabase
      .from('profiles')
      .select('full_name, usn')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('registrations')
      .select('event_id, qr_token')
      .eq('student_id', user!.id),
  ])

  const allEvents = allEventsRes.data
  const profile = profileRes.data
  const registrations = registrationsRes.data

  const registrationMap: Record<string, string> = {}
  for (const r of registrations || []) {
    registrationMap[r.event_id] = r.qr_token
  }

  const events = (allEvents as Event[]) || []

  return (
    <RealtimeCalendarView
      initialEvents={events}
      registrationMap={registrationMap}
      studentName={profile?.full_name || ''}
      studentUsn={profile?.usn || ''}
    />
  )
}
