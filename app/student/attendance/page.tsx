import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentAttendanceClient } from '@/components/student/StudentAttendanceClient'

export const dynamic = 'force-dynamic'

export default async function StudentAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch initial checked_in (attended) registrations
  const { data: attendanceData } = await supabase
    .from('registrations')
    .select('id, event_id, checked_in, checked_in_at, event_title, club_name, event_date')
    .eq('student_id', user.id)
    .eq('checked_in', true)
    .order('checked_in_at', { ascending: false })

  const attendedList = attendanceData || []

  return (
    <StudentAttendanceClient initialAttendance={attendedList} userId={user.id} />
  )
}
