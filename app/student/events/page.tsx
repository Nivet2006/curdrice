import { createClient } from '@/lib/supabase/server'
import { StudentEventsView } from '@/components/student/StudentEventsView'
import type { Event, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function StudentEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const eventColumns = 'id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, banner_url, approval_status, discussion_enabled, thread_mode, created_by, created_at, feedback_open, is_public'

  // Run all queries in parallel
  const [allEventsRes, profileRes, registrationsRes] = await Promise.all([
    supabase
      .from('events')
      .select(eventColumns)
      .eq('approval_status', 'approved')
      .order('event_date', { ascending: true }),
    supabase
      .from('profiles')
      .select('full_name, usn')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('registrations')
      .select('event_id, qr_token, is_waitlisted')
      .eq('student_id', user!.id),
  ])

  const allEvents = allEventsRes.data
  const profile = profileRes.data
  const registrations = registrationsRes.data

  const events = (allEvents as Event[]) || []

  return (
    <StudentEventsView
      initialEvents={events}
      registrations={registrations || []}
      profile={profile as Profile | null}
    />
  )
}