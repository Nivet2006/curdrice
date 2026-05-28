import { createClient } from '@/lib/supabase/server'
import { StudentProfileClient } from '@/components/student/StudentProfileClient'
import { ProfileUpdateSlider } from '@/components/student/ProfileUpdateSlider'

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
    <div className="space-y-8">
      <StudentProfileClient
        profile={profile}
        email={user?.email || ''}
        totalRegistrations={registrations?.length || 0}
        totalAttended={attended?.length || 0}
      />

      {/* Profile Update Request Slider */}
      <div className="w-full max-w-2xl mx-auto">
        <ProfileUpdateSlider
          currentProfile={{
            full_name: profile.full_name,
            usn: profile.usn,
            department: profile.department,
            semester: profile.semester,
            year: profile.year,
          }}
        />
      </div>
    </div>
  )
}
