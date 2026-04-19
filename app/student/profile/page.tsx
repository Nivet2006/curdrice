import { createClient } from '@/lib/supabase/server'
import { StudentProfileClient } from '@/components/student/StudentProfileClient'

export const dynamic = 'force-dynamic'

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('event_id')
    .eq('student_id', user!.id)

  const { data: attended } = await supabase
    .from('registrations')
    .select('event_id')
    .eq('student_id', user!.id)
    .eq('checked_in', true)

  return (
    <StudentProfileClient
      profile={profile}
      email={user?.email || ''}
      totalRegistrations={registrations?.length || 0}
      totalAttended={attended?.length || 0}
    />
  )
}
