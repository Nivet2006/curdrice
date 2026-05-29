import { createClient } from '@/lib/supabase/server'
import { StudentProfileClient } from '@/components/student/StudentProfileClient'
import { ProfileUpdateSlider } from '@/components/student/ProfileUpdateSlider'

export const dynamic = 'force-dynamic'

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, usn, department, semester, year, username, role, profile_edited, created_at')
    .eq('id', user!.id)
    .single()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('event_id, checked_in')
    .eq('student_id', user!.id)

  const totalRegistrations = registrations?.length || 0
  const totalAttended = (registrations || []).filter(r => r.checked_in).length

  return (
    <div className="space-y-8">
      <StudentProfileClient
        profile={profile as any}
        email={user?.email || ''}
        totalRegistrations={totalRegistrations}
        totalAttended={totalAttended}
      />

      {/* Profile Update Request Slider */}
      <div className="w-full max-w-2xl mx-auto">
        <ProfileUpdateSlider
          currentProfile={{
            full_name: profile?.full_name || '',
            usn: profile?.usn || '',
            department: profile?.department || '',
            semester: profile?.semester || 1,
            year: profile?.year || 1,
          }}
        />
      </div>
    </div>
  )
}
