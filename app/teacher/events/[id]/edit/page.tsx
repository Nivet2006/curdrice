import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditEventForm from '@/components/teacher/EditEventForm'

export default async function TeacherEditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    redirect('/teacher/dashboard')
  }

  // Fetch event and constraints
  const [eventRes, constraintsRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, club_name, location, event_date, end_time, registration_deadline, max_capacity, status, approval_status, targeted_department, banner_url, custom_background, is_public, event_category, is_compulsory, event_type, team_formation_enabled, min_team_members, max_team_members, location_lat, location_lng, created_by')
      .eq('id', id)
      .eq('created_by', user.id)
      .maybeSingle(),
    supabase
      .from('event_constraints')
      .select('id, event_id, allowed_semesters, allowed_years, allowed_departments')
      .eq('event_id', id)
      .maybeSingle()
  ])

  const event = eventRes.data
  const constraints = constraintsRes.data

  if (!event || event.approval_status !== 'draft') {
    notFound()
  }

  return (
    <div className="pb-20">
      <EditEventForm event={event} constraints={constraints} />
    </div>
  )
}
