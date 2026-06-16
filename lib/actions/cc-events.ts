'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logMutation } from '@/lib/audit/log-mutation'

export async function createDraftEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Extract profiles to check for cc role
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'cc' && profile?.role !== 'admin' && profile?.role !== 'manager') {
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

  if (venueId) {
    const { data: venue } = await supabase.from('venues').select('name').eq('id', venueId).single()
    if (venue) location = venue.name
  }

  if (!feedback_config || feedback_config.length < 3) {
    return { error: 'Policy: You must define at least 3 feedback questions for the event survey.' }
  }

  if (!title || !club_name || !description || !location || !event_date || !deadlineStr || !banner_url) {
    return { error: 'Missing required fields.' }
  }

  const eventDt = new Date(event_date)
  const pregeneratedId = formData.get('id') as string | null

  // VENUE CONFLICT CHECK
  if (venueId && endTimeStr) {
    const { getVenuesWithStatus } = await import('@/lib/actions/venue-actions')
    const startIso = eventDt.toISOString()
    const endIso = new Date(endTimeStr).toISOString()
    
    const statusRes = await getVenuesWithStatus(startIso, endIso, pregeneratedId)
    if (statusRes.error) {
      return { error: statusRes.error }
    }
    const currentVenueStatus = statusRes.venues?.find(v => v.id === venueId)
    if (currentVenueStatus?.status === 'locked') {
      return { error: currentVenueStatus.message }
    }
    if (currentVenueStatus?.status === 'unavailable') {
      return { error: currentVenueStatus.message }
    }
  } else {
    // Fallback conflict check
    const fourHoursInMs = 4 * 60 * 60 * 1000
    const startTime = new Date(eventDt.getTime() - fourHoursInMs).toISOString()
    const endTime = new Date(eventDt.getTime() + fourHoursInMs).toISOString()

    const { data: conflict } = await supabase
      .from('events')
      .select('title, event_date')
      .eq('location', location)
      .eq('approval_status', 'approved')
      .gte('event_date', startTime)
      .lte('event_date', endTime)
      .maybeSingle()

    if (conflict) {
      return { 
        error: `Venue Conflict: "${location}" is already booked for "${conflict.title}" at ${new Date(conflict.event_date).toLocaleTimeString()}. Please choose a different venue or time.` 
      }
    }
  }

  const deadlineDt = new Date(deadlineStr)

  if (deadlineDt >= eventDt) return { error: 'Deadline must be before event date.' }

  const semStr = formData.get('semesters') as string
  const yearStr = formData.get('years') as string
  const sems = JSON.parse(semStr || '[]')
  const years = JSON.parse(yearStr || '[]')

  const isSubmission = formData.get('submitForReview') === 'true'
  const approval_status = isSubmission ? 'pending_teacher' : 'draft'

  const insertData: any = {
    title, club_name, description, location,
    event_date: eventDt.toISOString(),
    end_time: endTimeStr ? new Date(endTimeStr).toISOString() : null,
    venue_id: venueId,
    registration_deadline: deadlineDt.toISOString(),
    max_capacity, banner_url, waitlist_max,
    custom_background,
    created_by: user.id,
    approval_status,
    targeted_department,
    feedback_config,
    is_public,
    status: 'upcoming'
  }

  if (pregeneratedId) {
    insertData.id = pregeneratedId
  }

  const { data: event, error } = await supabase.from('events').insert(insertData).select('id').single()

  if (error || !event) return { error: error?.message || 'Failed to create event' }

  const { error: constraintError } = await supabase.from('event_constraints').insert({
    event_id: event.id,
    allowed_semesters: sems.length ? sems : null,
    allowed_years: years.length ? years : null,
    allowed_departments: targeted_department ? [targeted_department] : null
  })

  if (constraintError) return { error: constraintError.message }

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

  if (venueId) {
    const { data: venue } = await supabase.from('venues').select('name').eq('id', venueId).single()
    if (venue) location = venue.name
  }

  if (!feedback_config || feedback_config.length < 3) {
    return { error: 'Policy: You must define at least 3 feedback questions before submitting or saving.' }
  }

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

  // VENUE CONFLICT CHECK
  if (venueId && endTimeStr) {
    const { getVenuesWithStatus } = await import('@/lib/actions/venue-actions')
    const startIso = eventDt.toISOString()
    const endIso = new Date(endTimeStr).toISOString()
    
    const statusRes = await getVenuesWithStatus(startIso, endIso, id)
    if (statusRes.error) {
      return { error: statusRes.error }
    }
    const currentVenueStatus = statusRes.venues?.find(v => v.id === venueId)
    if (currentVenueStatus?.status === 'locked') {
      return { error: currentVenueStatus.message }
    }
    if (currentVenueStatus?.status === 'unavailable') {
      return { error: currentVenueStatus.message }
    }
  } else {
    // Fallback conflict check (± 4 hours for a session)
    const fourHoursInMs = 4 * 60 * 60 * 1000
    const startTime = new Date(eventDt.getTime() - fourHoursInMs).toISOString()
    const endTime = new Date(eventDt.getTime() + fourHoursInMs).toISOString()

    const { data: conflict } = await supabase
      .from('events')
      .select('title, event_date')
      .eq('location', location)
      .eq('approval_status', 'approved')
      .neq('id', id)
      .gte('event_date', startTime)
      .lte('event_date', endTime)
      .maybeSingle()

    if (conflict) {
      return { 
        error: `Venue Conflict: "${location}" is already booked for "${conflict.title}" at ${new Date(conflict.event_date).toLocaleTimeString()}. Please choose a different venue or time.` 
      }
    }
  }

  const { data: currentEvent, error: fetchError } = await supabase
    .from('events')
    .select('approval_status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    return { error: `Database error: ${fetchError.message}` }
  }
  if (!currentEvent) {
    return { error: 'Event not found or access denied.' }
  }

  const isAlreadyApproved = currentEvent.approval_status === 'approved'
  const isSubmission = formData.get('submitForReview') === 'true'
  const approval_status = isAlreadyApproved ? 'approved' : (isSubmission ? 'pending_teacher' : 'draft')

  const { error: eventError } = await supabase.from('events').update({
    title, club_name, description, location,
    event_date: eventDt.toISOString(),
    end_time: endTimeStr ? new Date(endTimeStr).toISOString() : null,
    venue_id: venueId,
    registration_deadline: deadlineDt.toISOString(),
    max_capacity, banner_url, waitlist_max,
    custom_background,
    approval_status,
    targeted_department,
    feedback_config,
    is_public,
    rejection_data: []
  }).eq('id', id).eq('created_by', user.id)

  if (eventError) return { error: eventError.message }

  const { error: constraintError } = await supabase.from('event_constraints').upsert({
    event_id: id,
    allowed_semesters: sems.length ? sems : null,
    allowed_years: years.length ? years : null,
    allowed_departments: targeted_department ? [targeted_department] : null
  }, { onConflict: 'event_id' })

  if (constraintError) return { error: constraintError.message }

  revalidatePath(`/cc/events/${id}`)
  return { success: true }
}

export async function toggleFeedback(eventId: string, isOpen: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check ownership/role
  const { data: event } = await supabase.from('events').select('created_by, club_name').eq('id', eventId).single()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  const isOwner = event?.created_by === user.id
  const isStaff = ['admin', 'teacher', 'hod', 'pr', 'cc', 'manager'].includes(profile?.role || '')

  if (!isOwner && !isStaff) {
    return { error: 'Unauthorized: You do not have permission to toggle feedback for this event.' }
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
