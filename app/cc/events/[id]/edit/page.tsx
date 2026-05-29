import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditEventForm from '@/components/cc/EditEventForm'

export default async function CCEditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!event) notFound()

  // Only allow editing if it's a draft OR has rejection data (meaning it needs revision)
  const isEditable = event.approval_status === 'draft' || (event.rejection_data && event.rejection_data.length > 0)
  if (!isEditable) {
    redirect(`/cc/events/${id}`)
  }

  const { data: constraints } = await supabase
    .from('event_constraints')
    .select('id, event_id, allowed_semesters, allowed_years, allowed_departments, created_at')
    .eq('event_id', id)
    .single()

  return (
    <div className="pb-20">
      <EditEventForm event={event} constraints={constraints} />
    </div>
  )
}
