import { createClient } from '@/lib/supabase/server'
import { EditEventForm } from '@/components/manager/EditEventForm'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: event } = await supabase.from('events').select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, banner_url, approval_status, created_by, created_at, is_public, targeted_department, feedback_config, feedback_open, discussion_enabled, thread_mode, rejection_data').eq('id', id).single()
  const { data: constraints } = await supabase.from('event_constraints').select('id, event_id, allowed_semesters, allowed_years, allowed_departments, created_at').eq('event_id', id).single()

  if (!event) return <div>Event not found</div>

  return <EditEventForm event={event as any} constraints={constraints as any} />
}
