'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createDraftEvent(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Extract profiles to check for cc role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'cc' && profile?.role !== 'admin') {
    return { error: 'Unauthorized: Requires Club Coordinator permissions.' }
  }

  const title = (formData.get('title') as string)?.trim()
  const club_name = (formData.get('clubName') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const location = (formData.get('location') as string)?.trim()
  const event_date = formData.get('eventDate') as string
  const deadlineStr = formData.get('deadline') as string
  const banner_url = (formData.get('bannerUrl') as string)?.trim() || null
  const capStr = formData.get('capacity') as string
  const max_capacity = capStr && parseInt(capStr) > 0 ? parseInt(capStr) : null
  const targeted_department = (formData.get('targetedDepartment') as string) || null
  const feedback_config = JSON.parse(formData.get('feedbackConfig') as string || '[]')

  if (!title || !club_name || !description || !location || !event_date || !deadlineStr || !banner_url) {
    return { error: 'Missing required fields.' }
  }

  const eventDt = new Date(event_date)
  const deadlineDt = new Date(deadlineStr)

  if (deadlineDt >= eventDt) return { error: 'Deadline must be before event date.' }

  const semStr = formData.get('semesters') as string
  const yearStr = formData.get('years') as string
  const sems = JSON.parse(semStr || '[]')
  const years = JSON.parse(yearStr || '[]')

  // Status defaults to draft but we immediately push it to 'pending_pr' upon "Submit for Review"
  // OR we can allow the user to save as literal draft first.
  const isSubmission = formData.get('submitForReview') === 'true'
  const approval_status = isSubmission ? 'pending_teacher' : 'draft'

  const { data: event, error } = await supabase.from('events').insert({
    title, club_name, description, location,
    event_date: eventDt.toISOString(),
    registration_deadline: deadlineDt.toISOString(),
    max_capacity, banner_url,
    created_by: user.id,
    approval_status,
    targeted_department,
    feedback_config,
    status: 'upcoming' // Visibility status
  }).select('id').single()

  if (error || !event) return { error: error?.message || 'Failed to create event' }

  const { error: constraintError } = await supabase.from('event_constraints').insert({
    event_id: event.id,
    allowed_semesters: sems.length ? sems : null,
    allowed_years: years.length ? years : null,
    allowed_departments: targeted_department ? [targeted_department] : null
  })

  if (constraintError) return { error: constraintError.message }

  revalidatePath('/cc/dashboard')
  return { success: true }
}

export async function submitReport(eventId: string, content: any, isFinal: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const status = isFinal ? 'pending_pr' : 'draft'

  const { error } = await supabase
    .from('reports')
    .upsert({
      event_id: eventId,
      content,
      status,
      updated_at: new Date().toISOString()
    })

  if (error) return { error: error.message }

  revalidatePath(`/cc/events/${eventId}`)
  return { success: true }
}
