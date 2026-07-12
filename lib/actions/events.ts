'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { logMutation } from '@/lib/audit/log-mutation'
import { checkRateLimit, getClientIp } from '@/lib/services/rate-limit-service'
import * as registrationService from '@/lib/services/registration-service'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role, department').eq('id', user.id).single()

  const title = (formData.get('title') as string)?.trim()
  const club_name = (formData.get('clubName') as string)?.trim()
  const status = formData.get('status') as string
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

  const event_category = (formData.get('eventCategory') as string) || 'standard'
  const is_compulsory = formData.get('isCompulsory') === 'true'
  const allow_open_registration = formData.get('allowOpenRegistration') === 'true'
  const assigned_faculty_id = (formData.get('assignedFacultyId') as string) || null

  const event_type = (formData.get('eventType') as string) || 'general'
  const team_formation_enabled = formData.get('teamFormationEnabled') === 'true'
  const minCapStr = formData.get('minTeamMembers') as string
  const min_team_members = minCapStr ? parseInt(minCapStr) : 2
  const maxCapStr = formData.get('maxTeamMembers') as string
  const max_team_members = maxCapStr ? parseInt(maxCapStr) : 4

  if (venueId) {
    const { data: venue } = await supabase.from('venues').select('name').eq('id', venueId).single()
    if (venue) location = venue.name
  }

  if (!title) return { error: 'Event Title is required.' }
  if (!club_name) return { error: 'Club / Host Identity is required.' }
  if (!description) return { error: 'Description is required.' }
  if (!location) return { error: 'Physical Location is required.' }
  if (!event_date) return { error: 'Event Date & Time is required.' }
  if (!deadlineStr) return { error: 'Registration Hard Deadline is required.' }
  if (!banner_url) return { error: 'Poster / Banner Image URL is required.' }

  const eventDt = new Date(event_date)
  const deadlineDt = new Date(deadlineStr)

  if (isNaN(eventDt.getTime())) return { error: 'Invalid Event Date & Time.' }
  if (isNaN(deadlineDt.getTime())) return { error: 'Invalid Registration Deadline.' }
  if (deadlineDt >= eventDt) return { error: 'Registration deadline must be before the Event Date & Time.' }

  const semStr = formData.get('semesters') as string
  const yearStr = formData.get('years') as string
  const deptStr = formData.get('departments') as string
  const sems = JSON.parse(semStr || '[]')
  const years = JSON.parse(yearStr || '[]')
  const depts = JSON.parse(deptStr || '[]')

  const pregeneratedId = formData.get('id') as string | null

  // VENUE CONFLICT CHECK
  if (venueId && endTimeStr) {
    const { getVenuesWithStatus } = await import('@/lib/actions/venue-actions')
    const startIso = eventDt.toISOString()
    const endIso = new Date(endTimeStr).toISOString()
    const statusRes = await getVenuesWithStatus(startIso, endIso, pregeneratedId)
    if (statusRes.error) return { error: statusRes.error }
    const currentVenueStatus = statusRes.venues?.find(v => v.id === venueId)
    if (currentVenueStatus?.status === 'locked') return { error: currentVenueStatus.message }
    if (currentVenueStatus?.status === 'unavailable') return { error: currentVenueStatus.message }
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

  const insertPayload: any = {
    title, club_name, status, description, location,
    event_date: eventDt.toISOString(),
    end_time: endTimeStr ? new Date(endTimeStr).toISOString() : null,
    venue_id: venueId,
    registration_deadline: deadlineDt.toISOString(),
    max_capacity, banner_url, waitlist_max,
    custom_background,
    created_by: user.id,
    event_category,
    is_compulsory,
    allow_open_registration,
    assigned_faculty_id,
    approval_status: profile?.role === 'teacher' ? 'pending_hod' : 'draft',
    targeted_department: profile?.role === 'teacher' ? (profile?.department || null) : null,
    event_type,
    team_formation_enabled,
    min_team_members,
    max_team_members
  }

  if (pregeneratedId) {
    insertPayload.id = pregeneratedId
  }

  const { data: event, error } = await supabase.from('events').insert(insertPayload).select('id').single()

  if (error || !event) return { error: error?.message || 'Failed to create event' }

  const { error: constraintError } = await supabase.from('event_constraints').insert({
    event_id: event.id,
    allowed_semesters: sems.length ? sems : null,
    allowed_years: years.length ? years : null,
    allowed_departments: depts.length ? depts : null
  })

  if (constraintError) return { error: constraintError.message }

  if (profile?.role === 'teacher') {
    redirect('/teacher/dashboard')
  } else {
    redirect('/manager/dashboard')
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: event } = await supabase.from('events').select('created_by').eq('id', eventId).single()

  if (!event) return { error: 'Event not found' }
  const isAuthorized = ['admin', 'manager', 'teacher', 'hod'].includes(profile?.role || '') || event.created_by === user.id
  if (!isAuthorized) {
    return { error: 'Unauthorized' }
  }

  const title = (formData.get('title') as string)?.trim()
  const club_name = (formData.get('clubName') as string)?.trim()
  const status = formData.get('status') as string
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

  const event_category = (formData.get('eventCategory') as string) || 'standard'
  const is_compulsory = formData.get('isCompulsory') === 'true'
  const allow_open_registration = formData.get('allowOpenRegistration') === 'true'
  const assigned_faculty_id = (formData.get('assignedFacultyId') as string) || null

  const event_type = (formData.get('eventType') as string) || 'general'
  const team_formation_enabled = formData.get('teamFormationEnabled') === 'true'
  const minCapStr = formData.get('minTeamMembers') as string
  const min_team_members = minCapStr ? parseInt(minCapStr) : 2
  const maxCapStr = formData.get('maxTeamMembers') as string
  const max_team_members = maxCapStr ? parseInt(maxCapStr) : 4

  if (venueId) {
    const { data: venue } = await supabase.from('venues').select('name').eq('id', venueId).single()
    if (venue) location = venue.name
  }

  if (!title) return { error: 'Event Title is required.' }
  if (!club_name) return { error: 'Club / Host Identity is required.' }
  if (!description) return { error: 'Description is required.' }
  if (!location) return { error: 'Physical Location is required.' }
  if (!event_date) return { error: 'Event Date & Time is required.' }
  if (!deadlineStr) return { error: 'Registration Hard Deadline is required.' }
  if (!banner_url) return { error: 'Poster / Banner Image URL is required.' }

  const eventDt = new Date(event_date)
  const deadlineDt = new Date(deadlineStr)

  if (isNaN(eventDt.getTime())) return { error: 'Invalid Event Date & Time.' }
  if (isNaN(deadlineDt.getTime())) return { error: 'Invalid Registration Deadline.' }
  if (deadlineDt >= eventDt) return { error: 'Registration deadline must be before the Event Date & Time.' }

  const semStr = formData.get('semesters') as string
  const yearStr = formData.get('years') as string
  const deptStr = formData.get('departments') as string
  const sems = JSON.parse(semStr || '[]')
  const years = JSON.parse(yearStr || '[]')
  const depts = JSON.parse(deptStr || '[]')

  // VENUE CONFLICT CHECK
  if (venueId && endTimeStr) {
    const { getVenuesWithStatus } = await import('@/lib/actions/venue-actions')
    const startIso = eventDt.toISOString()
    const endIso = new Date(endTimeStr).toISOString()
    const statusRes = await getVenuesWithStatus(startIso, endIso, eventId)
    if (statusRes.error) return { error: statusRes.error }
    const currentVenueStatus = statusRes.venues?.find(v => v.id === venueId)
    if (currentVenueStatus?.status === 'locked') return { error: currentVenueStatus.message }
    if (currentVenueStatus?.status === 'unavailable') return { error: currentVenueStatus.message }
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
      .neq('id', eventId)
      .gte('event_date', startTime)
      .lte('event_date', endTime)
      .maybeSingle()

    if (conflict) {
      return { 
        error: `Venue Conflict: "${location}" is already booked for "${conflict.title}" at ${new Date(conflict.event_date).toLocaleTimeString()}. Please choose a different venue or time.` 
      }
    }
  }

  const { error: updateError } = await supabase.from('events').update({
    title, club_name, status, description, location,
    event_date: eventDt.toISOString(),
    end_time: endTimeStr ? new Date(endTimeStr).toISOString() : null,
    venue_id: venueId,
    registration_deadline: deadlineDt.toISOString(),
    max_capacity, banner_url, waitlist_max,
    custom_background,
    event_category,
    is_compulsory,
    allow_open_registration,
    assigned_faculty_id,
    event_type,
    team_formation_enabled,
    min_team_members,
    max_team_members
  }).eq('id', eventId)

  if (updateError) return { error: updateError.message }

  await supabase.from('event_constraints').delete().eq('event_id', eventId)

  const { error: constraintError } = await supabase.from('event_constraints').insert({
    event_id: eventId,
    allowed_semesters: sems.length ? sems : null,
    allowed_years: years.length ? years : null,
    allowed_departments: depts.length ? depts : null
  })

  if (constraintError) return { error: constraintError.message }

  if (profile?.role === 'teacher') {
    redirect(`/teacher/dashboard`)
  } else {
    redirect(`/manager/events/${eventId}`)
  }
}

async function notifyEventCancelled(eventId: string, eventTitle: string) {
  const supabase = await createClient()
  const { data: registrants } = await supabase
    .from('registrations')
    .select('student_id, profiles(email, full_name)')
    .eq('event_id', eventId)

  if (registrants && registrants.length > 0) {
    const { triggerEventCancelled } = await import('@/lib/services/notification-service')
    for (const reg of registrants) {
      const student = (reg as any).profiles
      if (student && student.email) {
        await triggerEventCancelled(
          student.email,
          reg.student_id,
          eventId,
          {
            eventName: eventTitle,
            reason: 'Cancelled by administrator'
          }
        ).catch(console.error)
      }
    }
  }
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: event } = await supabase.from('events').select('created_by, title').eq('id', eventId).single()

  if (!event) return { error: 'Event not found' }
  if (profile?.role !== 'admin' && profile?.role !== 'manager' && !(profile?.role === 'teacher' && event.created_by === user.id)) {
    return { error: 'Unauthorized' }
  }

  // Notify registrants before deleting
  await notifyEventCancelled(eventId, event.title || 'Event')

  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return { error: error.message }

  if (profile?.role === 'admin') {
    redirect('/admin/events')
  } else if (profile?.role === 'teacher') {
    redirect('/teacher/dashboard')
  }

  redirect('/manager/dashboard')
}

export async function deleteEventsBulk(eventIds: string[], totpCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized. Only admins can perform bulk deletions.' }

  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  const { data: adminProfile } = await supabaseAdmin.from('profiles').select('totp_secret, totp_enabled').eq('id', user.id).single()
  
  if (!adminProfile?.totp_enabled || !adminProfile?.totp_secret) {
    return { error: '2FA not enabled. You must enable 2FA to perform bulk deletions.' }
  }

  const { verify } = await import('otplib')
  const result = await verify({
    token: totpCode,
    secret: adminProfile.totp_secret
  })

  if (!result || (typeof result === 'object' && !result.valid)) {
    return { error: 'Invalid verification code' }
  }

  // Fetch all titles for audit/notification
  const { data: deletedEvents } = await supabase
    .from('events')
    .select('id, title')
    .in('id', eventIds)

  if (deletedEvents) {
    for (const e of deletedEvents) {
      await notifyEventCancelled(e.id, e.title || 'Event')
    }
  }

  const { error } = await supabase.from('events').delete().in('id', eventIds)
  if (error) return { error: error.message }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/events')

  return { success: true }
}

export async function registerForEvent(eventId: string) {
  const { revalidatePath } = await import('next/cache')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const ip = await getClientIp()
    await checkRateLimit(`join_${ip}`, 'join_event', { maxRequests: 5, windowMs: 60000 })
  } catch (err: any) {
    return { error: err.message || 'Rate limit exceeded. Please try again later.' }
  }

  let result;
  try {
    result = await registrationService.registerForEvent({
      eventId,
      studentId: user.id
    }, user.id)
  } catch (err: any) {
    return { error: err.message }
  }

  // Trigger notification only if NOT waitlisted
  if (!result.waitlisted) {
    const { createEventNotification } = await import('@/lib/actions/messages')
    await createEventNotification(user.id, eventId, result.qrToken)

    // Auto-join event discussion thread if enabled
    const { joinEventThread } = await import('@/lib/actions/event-threads')
    await joinEventThread(eventId, user.id)
  }

  revalidatePath(`/student/events/${eventId}`)
  return { success: true, waitlisted: result.waitlisted }
}

export async function updateStudentProfile(data: {
  full_name: string
  username: string
  department: string
  semester: number
  year: number
}) {
  try {
    const { revalidatePath } = await import('next/cache')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_edited')
      .eq('id', user.id)
      .single()

    if (profile?.profile_edited) {
      return { error: 'Profile already edited. Contact admin to make changes.' }
    }

    if (data.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', data.username.toLowerCase().trim())
        .neq('id', user.id)
        .single()

      if (existing) {
        return { error: 'Username already taken. Choose a different one.' }
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name.trim(),
        username: data.username.toLowerCase().trim() || null,
        department: data.department,
        semester: data.semester,
        year: data.year,
        profile_edited: true
      })
      .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/student/profile')
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return { error: errorMsg || 'Failed to update profile' }
  }
}

export async function cancelRegistration(eventId: string) {
  try {
    const { revalidatePath } = await import('next/cache')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    await registrationService.cancelRegistration(eventId, user.id, user.id)

    revalidatePath(`/student/events/${eventId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateHackathonConfig(
  eventId: string,
  criteria: any[],
  showEvaluationCriteria: boolean,
  showScoreboard: boolean,
  submissionsEnabled?: boolean,
  submissionConfig?: any,
  showProjectSubmission?: boolean,
  teamCreationEnabled?: boolean,
  teamDeletionEnabled?: boolean,
  teamJoinRequestsEnabled?: boolean,
  teamInvitesEnabled?: boolean
) {
  try {
    const { revalidatePath } = await import('next/cache')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check permissions
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single()

    if (eventError || !event) return { error: 'Event not found' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isCreator = event.created_by === user.id
    const isAdminOrHODOrTeacher = profile && ['admin', 'hod', 'teacher'].includes(profile.role)

    if (!isCreator && !isAdminOrHODOrTeacher) {
      return { error: 'You are not authorized to configure this event.' }
    }

    const { error: updateError } = await supabase
      .from('events')
      .update({
        hackathon_criteria: criteria,
        show_evaluation_criteria: showEvaluationCriteria,
        show_scoreboard: showScoreboard,
        submissions_enabled: submissionsEnabled,
        submission_config: submissionConfig,
        show_project_submission: showProjectSubmission,
        team_creation_enabled: teamCreationEnabled,
        team_deletion_enabled: teamDeletionEnabled,
        team_join_requests_enabled: teamJoinRequestsEnabled,
        team_invites_enabled: teamInvitesEnabled
      })
      .eq('id', eventId)

    if (updateError) return { error: updateError.message }

    revalidatePath(`/student/events/${eventId}`)
    revalidatePath(`/teacher/verify/${eventId}`)
    revalidatePath(`/cc/events/${eventId}/edit`)
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return { error: errorMsg }
  }
}