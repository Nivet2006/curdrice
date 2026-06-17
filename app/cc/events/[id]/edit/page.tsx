import { createClient, getCachedAuthUser } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditEventForm from '@/components/cc/EditEventForm'

export default async function CCEditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const user = await getCachedAuthUser()

  if (!user) redirect('/login')

  // Parallel fetch to avoid sequential database roundtrips
  const [eventRes, constraintsRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at, event_type, team_formation_enabled, min_team_members, max_team_members, hackathon_criteria, show_evaluation_criteria, show_scoreboard, submissions_enabled, submission_config, show_project_submission, team_creation_enabled, team_deletion_enabled, team_join_requests_enabled, team_invites_enabled')
      .eq('id', id)
      .eq('created_by', user.id)
      .maybeSingle(),
    supabase
      .from('event_constraints')
      .select('id, event_id, allowed_semesters, allowed_years, allowed_departments, created_at')
      .eq('event_id', id)
      .maybeSingle()
  ])

  const event = eventRes.data
  const constraints = constraintsRes.data

  if (!event) notFound()

  return (
    <div className="pb-20">
      <EditEventForm event={event} constraints={constraints} />
    </div>
  )
}
