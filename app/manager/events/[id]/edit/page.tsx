import { createClient } from '@/lib/supabase/server'
import { EditEventForm } from '@/components/manager/EditEventForm'

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('*').eq('id', params.id).single()
  const { data: constraints } = await supabase.from('event_constraints').select('*').eq('event_id', params.id).single()

  if (!event) return <div>Event not found</div>

  return <EditEventForm event={event} constraints={constraints || {}} />
}
