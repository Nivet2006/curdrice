import { createClient } from '@/lib/supabase/server'
import { RealtimeCalendarView } from '@/components/student/RealtimeCalendarView'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function StudentEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .eq('approval_status', 'approved')
    .order('event_date', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, usn')
    .eq('id', user!.id)
    .single()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('event_id, qr_token')
    .eq('student_id', user!.id)

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