'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logMutation } from '@/lib/audit/log-mutation'
import { assertCC, assertOwnershipOrRoles } from '@/lib/services/permission-service'
import * as eventService from '@/lib/services/event-service'

export async function createDraftEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  let profile;
  try {
    const auth = await assertCC()
    profile = auth.profile
  } catch (error: any) {
    return { error: 'Unauthorized: Requires higher permissions.' }
  }

  const title = (formData.get('title') as string)?.trim()
  const club_name = (formData.get('clubName') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const venueId = formData.get('venueId') as string || null
  const endTimeStr = formData.get('endTime') as string || null
  let location = (formData.get('location') as string)?.trim() || ''
  const event_date = formData.get('eventDate') as string
  const deadlineStr = formData.get('deadline') as string
  const banner_url = (formData.get('bannerUrl') as string)?.trim() || null
  const custom_background = (formData.get('customBackground') as string) || null
  const capStr = formData.get('capacity') as string
  const max_capacity = capStr && parseInt(capStr) > 0 ? parseInt(capStr) : null
  const waitlistCapStr = formData.get('waitlistMax') as string
  const waitlist_max = waitlistCapStr && parseInt(waitlistCapStr) > 0 ? parseInt(waitlistCapStr) : 0
  const targeted_department = (formData.get('targetedDepartment') as string) || null
  const feedback_config = JSON.parse(formData.get('feedbackConfig') as string || '[]')
  const is_public = formData.get('isPublic') === 'true'

  const event_type = (formData.get('eventType') as string) || 'general'
  const team_formation_enabled = formData.get('teamFormationEnabled') === 'true'
  const minCapStr = formData.get('minTeamMembers') as string
  const min_team_members = minCapStr ? parseInt(minCapStr) : 2
  const maxCapStr = formData.get('maxTeamMembers') as string
  const max_team_members = maxCapStr ? parseInt(maxCapStr) : 4

  const eventDt = new Date(event_date)
  const deadlineDt = new Date(deadlineStr)
  if (deadlineDt >= eventDt) return { error: 'Deadline must be before event date.' }

  const semStr = formData.get('semesters') as string
  const yearStr = formData.get('years') as string
  const sems = JSON.parse(semStr || '[]')
  const years = JSON.parse(yearStr || '[]')

  const isSubmission = formData.get('submitForReview') === 'true'
  const approval_status = isSubmission ? 'pending_teacher' : 'draft'

  let event;
  try {
    event = await eventService.createEvent({
      title,
      club_name,
      description,
      location,
      event_date: eventDt.toISOString(),
      end_time: endTimeStr ? new Date(endTimeStr).toISOString() : null,
      venue_id: venueId,
      registration_deadline: deadlineDt.toISOString(),
      max_capacity,
      waitlist_max,
      banner_url,
      custom_background,
      approval_status,
      targeted_department,
      event_category: 'general',
      is_public,
      event_type,
      team_formation_enabled,
      min_team_members,
      max_team_members,
      constraints: {
        allowed_semesters: sems.length ? sems : null,
        allowed_years: years.length ? years : null,
        allowed_departments: targeted_department ? [targeted_department] : null
      }
    }, user.id)
  } catch (err: any) {
    return { error: err.message }
  }

  // LOG MUTATION
  await logMutation({
    userId: user.id,
    userEmail: user.email,
    userName: profile.full_name,
    userRole: profile.role,
    action: 'event.create',
    path: '/cc/dashboard',
    metadata: { 
        eventId: event.id, 
        title, 
        approval_status 
    },
  })

  revalidatePath('/cc/dashboard')
  return { success: true }
}

export async function submitReport(eventId: string, content: any, isFinal: boolean) {
  const supabase = await createClient()
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

export async function submitEventForReview(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('events')
    .update({ approval_status: 'pending_teacher' })
    .eq('id', id)
  
  if (error) throw error
  revalidatePath('/cc/dashboard')
  revalidatePath(`/cc/events/${id}`)
}

export async function updateEventDraft(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const club_name = (formData.get('clubName') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const venueId = formData.get('venueId') as string || null
  const endTimeStr = formData.get('endTime') as string || null
  let location = (formData.get('location') as string)?.trim() || ''
  const event_date = formData.get('eventDate') as string
  const deadlineStr = formData.get('deadline') as string
  const banner_url = (formData.get('bannerUrl') as string)?.trim() || null
  const custom_background = (formData.get('customBackground') as string) || null
  const capStr = formData.get('capacity') as string
  const max_capacity = capStr && parseInt(capStr) > 0 ? parseInt(capStr) : null
  const waitlistCapStr = formData.get('waitlistMax') as string
  const waitlist_max = waitlistCapStr && parseInt(waitlistCapStr) > 0 ? parseInt(waitlistCapStr) : 0
  const targeted_department = (formData.get('targetedDepartment') as string) || null
  const feedback_config = JSON.parse(formData.get('feedbackConfig') as string || '[]')
  const is_public = formData.get('isPublic') === 'true'

  const event_type = (formData.get('eventType') as string) || 'general'
  const team_formation_enabled = formData.get('teamFormationEnabled') === 'true'
  const minCapStr = formData.get('minTeamMembers') as string
  const min_team_members = minCapStr ? parseInt(minCapStr) : 2
  const maxCapStr = formData.get('maxTeamMembers') as string
  const max_team_members = maxCapStr ? parseInt(maxCapStr) : 4

  const eventDt = new Date(event_date)
  const deadlineDt = new Date(deadlineStr)
  if (deadlineDt >= eventDt) return { error: 'Deadline must be before event date.' }

  const semStr = formData.get('semesters') as string
  const yearStr = formData.get('years') as string
  const sems = JSON.parse(semStr || '[]')
  const years = JSON.parse(yearStr || '[]')

  // Check if it was already approved
  const { data: currentEvent } = await supabase.from('events').select('approval_status').eq('id', id).single()
  const isAlreadyApproved = currentEvent?.approval_status === 'approved'
  const isSubmission = formData.get('submitForReview') === 'true'
  const approval_status = isAlreadyApproved ? 'approved' : (isSubmission ? 'pending_teacher' : 'draft')

  try {
    await eventService.updateEventDraft(id, {
      title,
      club_name,
      description,
      location,
      event_date: eventDt.toISOString(),
      end_time: endTimeStr ? new Date(endTimeStr).toISOString() : null,
      venue_id: venueId,
      registration_deadline: deadlineDt.toISOString(),
      max_capacity,
      waitlist_max,
      banner_url,
      custom_background,
      approval_status,
      targeted_department,
      is_public,
      event_type,
      team_formation_enabled,
      min_team_members,
      max_team_members,
      constraints: {
        allowed_semesters: sems.length ? sems : null,
        allowed_years: years.length ? years : null,
        allowed_departments: targeted_department ? [targeted_department] : null
      }
    }, user.id)
  } catch (err: any) {
    return { error: err.message }
  }

  revalidatePath(`/cc/events/${id}`)
  return { success: true }
}

export async function toggleFeedback(eventId: string, isOpen: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: event } = await supabase.from('events').select('created_by, club_name').eq('id', eventId).single()
  if (!event) return { error: 'Event not found' }

  try {
    await assertOwnershipOrRoles(event.created_by, ['admin', 'teacher', 'hod', 'pr', 'cc', 'manager'])
  } catch (error: any) {
    return { error: error.message }
  }

  const { error, data } = await supabase
    .from('events')
    .update({ feedback_open: isOpen })
    .eq('id', eventId)
    .select()

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Failed to update: Event not found or permission denied.' }
  
  revalidatePath(`/cc/events/${eventId}`)
  revalidatePath(`/student/events/${eventId}`)
  return { success: true }
}

export async function toggleRegistrationStopped(eventId: string, stopped: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check ownership/role
  const { data: event } = await supabase.from('events').select('created_by, club_name').eq('id', eventId).single()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  const isOwner = event?.created_by === user.id
  const isStaff = ['admin', 'teacher', 'hod', 'pr', 'cc', 'manager'].includes(profile?.role || '')

  if (!isOwner && !isStaff) {
    return { error: 'Unauthorized: You do not have permission to toggle registrations for this event.' }
  }

  const { error, data } = await supabase
    .from('events')
    .update({ registration_stopped: stopped })
    .eq('id', eventId)
    .select()

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Failed to update: Event not found or permission denied.' }
  
  revalidatePath(`/cc/events/${eventId}`)
  revalidatePath(`/student/events/${eventId}`)
  return { success: true }
}
