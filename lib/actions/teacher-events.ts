'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logMutation } from '@/lib/audit/log-mutation'
import { assertTeacherOrAdmin } from '@/lib/services/permission-service'
import * as eventService from '@/lib/services/event-service'

export async function createFacultyEvent(formData: FormData) {
  const supabase = await createClient()
  let auth;
  try {
    auth = await assertTeacherOrAdmin()
  } catch (error: any) {
    return { error: error.message }
  }

  const { profile } = auth;

  const title = (formData.get('title') as string)?.trim()
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
  const targeted_department = (formData.get('targetedDepartment') as string) || profile.department || null
  const event_category = (formData.get('eventCategory') as string) || 'faculty'
  const guest_name = (formData.get('guestName') as string)?.trim() || null
  const is_public = formData.get('isPublic') === 'true'
  const is_compulsory = formData.get('isCompulsory') === 'true'

  const event_type = (formData.get('eventType') as string) || 'general'
  const team_formation_enabled = formData.get('teamFormationEnabled') === 'true'
  const minCapStr = formData.get('minTeamMembers') as string
  const min_team_members = minCapStr ? parseInt(minCapStr) : 2
  const maxCapStr = formData.get('maxTeamMembers') as string
  const max_team_members = maxCapStr ? parseInt(maxCapStr) : 4
  const locationLatStr = formData.get('locationLat') as string | null
  const locationLngStr = formData.get('locationLng') as string | null
  const location_lat = locationLatStr ? parseFloat(locationLatStr) : null
  const location_lng = locationLngStr ? parseFloat(locationLngStr) : null

  if (venueId && event_category !== 'industrial_visit') {
    const { data: venue } = await supabase.from('venues').select('name').eq('id', venueId).single()
    if (venue) location = venue.name
  }

  // Parse semesters/years for compulsory events
  let allowed_semesters: number[] | null = null
  let allowed_years: number[] | null = null
  if (is_compulsory) {
    try {
      const rawSems = formData.get('semesters') as string
      const rawYears = formData.get('years') as string
      const parsedSems = rawSems ? JSON.parse(rawSems) : []
      const parsedYears = rawYears ? JSON.parse(rawYears) : []
      allowed_semesters = parsedSems.length > 0 ? parsedSems : null
      allowed_years = parsedYears.length > 0 ? parsedYears : null
    } catch {
      // ignore parse errors, fall back to null
    }
  }

  const club_name = guest_name
    ? `Guest Lecture — ${guest_name}`
    : event_category === 'faculty'
    ? 'Faculty Initiative'
    : event_category === 'industrial_visit'
    ? 'Industrial Visit'
    : event_category.charAt(0).toUpperCase() + event_category.slice(1)

  if (!title || !description || !location || !event_date || !deadlineStr) {
    return { error: 'Missing required fields: Title, Description, Location, Date and Deadline are all required.' }
  }

  const eventDt = new Date(event_date)
  const deadlineDt = new Date(deadlineStr)

  if (deadlineDt >= eventDt) {
    return { error: 'Registration deadline must be before the event date.' }
  }

  const approval_status = 'pending_hod'

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
      event_category,
      is_public,
      is_compulsory,
      event_type,
      team_formation_enabled,
      min_team_members,
      max_team_members,
      location_lat,
      location_lng,
      constraints: {
        allowed_semesters,
        allowed_years,
        allowed_departments: targeted_department ? [targeted_department] : null
      }
    }, auth.userId)
  } catch (err: any) {
    return { error: err.message }
  }

  // Audit log
  await logMutation({
    userId: auth.userId,
    userEmail: profile.email,
    userName: profile.full_name,
    userRole: profile.role,
    action: 'faculty_event.create',
    path: '/teacher/events/create',
    metadata: {
      eventId: event.id,
      title,
      approval_status,
      event_category,
      is_compulsory,
      ...(is_compulsory ? { allowed_semesters, allowed_years } : {}),
    },
  })

  revalidatePath('/teacher/dashboard')
  revalidatePath('/hod/dashboard')

  return { success: true, eventId: event.id }
}


export async function saveTeacherEventDraft(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, department')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Only Faculty (Teacher) can save drafts.' }
  }

  const pregeneratedId = formData.get('id') as string | null
  if (!pregeneratedId) {
    return { error: 'ID is required to save a draft.' }
  }

  const title = (formData.get('title') as string)?.trim() || 'Untitled Event'
  const description = (formData.get('description') as string)?.trim() || ''
  const venueId = formData.get('venueId') as string || null
  const endTimeStr = formData.get('endTime') as string || null
  let location = (formData.get('location') as string)?.trim() || ''
  const event_date_raw = formData.get('eventDate') as string
  const deadlineStr_raw = formData.get('deadline') as string
  const banner_url = (formData.get('bannerUrl') as string)?.trim() || null
  const custom_background = (formData.get('customBackground') as string) || null
  const capStr = formData.get('capacity') as string
  const max_capacity = capStr && parseInt(capStr) > 0 ? parseInt(capStr) : null
  const waitlistCapStr = formData.get('waitlistMax') as string
  const waitlist_max = waitlistCapStr && parseInt(waitlistCapStr) > 0 ? parseInt(waitlistCapStr) : 0
  const targeted_department = (formData.get('targetedDepartment') as string) || profile.department || null
  const event_category = (formData.get('eventCategory') as string) || 'faculty'
  const guest_name = (formData.get('guestName') as string)?.trim() || null
  const is_public = formData.get('isPublic') === 'true'
  const is_compulsory = formData.get('isCompulsory') === 'true'

  const event_type = (formData.get('eventType') as string) || 'general'
  const team_formation_enabled = formData.get('teamFormationEnabled') === 'true'
  const minCapStr = formData.get('minTeamMembers') as string
  const min_team_members = minCapStr ? parseInt(minCapStr) : 2
  const maxCapStr = formData.get('maxTeamMembers') as string
  const max_team_members = maxCapStr ? parseInt(maxCapStr) : 4
  const locationLatStr = formData.get('locationLat') as string | null
  const locationLngStr = formData.get('locationLng') as string | null
  const location_lat = locationLatStr ? parseFloat(locationLatStr) : null
  const location_lng = locationLngStr ? parseFloat(locationLngStr) : null

  if (venueId && event_category !== 'industrial_visit') {
    const { data: venue } = await supabase.from('venues').select('name').eq('id', venueId).single()
    if (venue) location = venue.name
  }

  // Parse semesters/years
  let allowed_semesters: number[] | null = null
  let allowed_years: number[] | null = null
  try {
    const rawSems = formData.get('semesters') as string
    const rawYears = formData.get('years') as string
    const parsedSems = rawSems ? JSON.parse(rawSems) : []
    const parsedYears = rawYears ? JSON.parse(rawYears) : []
    allowed_semesters = parsedSems.length > 0 ? parsedSems : null
    allowed_years = parsedYears.length > 0 ? parsedYears : null
  } catch {
    // ignore
  }

  const club_name = guest_name
    ? `Guest Lecture — ${guest_name}`
    : event_category === 'faculty'
    ? 'Faculty Initiative'
    : event_category === 'industrial_visit'
    ? 'Industrial Visit'
    : event_category.charAt(0).toUpperCase() + event_category.slice(1)

  const eventDtIso = event_date_raw ? new Date(event_date_raw).toISOString() : new Date().toISOString()
  const deadlineDtIso = deadlineStr_raw ? new Date(deadlineStr_raw).toISOString() : null

  const upsertPayload: any = {
    id: pregeneratedId,
    title,
    club_name,
    description,
    location,
    event_date: eventDtIso,
    end_time: endTimeStr ? new Date(endTimeStr).toISOString() : null,
    venue_id: venueId,
    registration_deadline: deadlineDtIso,
    max_capacity,
    waitlist_max,
    banner_url,
    custom_background,
    created_by: user.id,
    approval_status: 'draft',
    targeted_department,
    feedback_config: [],
    is_public,
    status: 'upcoming',
    event_category,
    assigned_faculty_id: user.id,
    is_compulsory,
    ...(location_lat !== null && location_lng !== null ? { location_lat, location_lng } : {}),
    event_type,
    team_formation_enabled,
    min_team_members,
    max_team_members
  }

  const { error: upsertError } = await supabase
    .from('events')
    .upsert(upsertPayload)

  if (upsertError) {
    return { error: upsertError.message }
  }

  // Upsert constraints
  const { error: constraintError } = await supabase
    .from('event_constraints')
    .upsert({
      event_id: pregeneratedId,
      allowed_semesters,
      allowed_years,
      allowed_departments: targeted_department ? [targeted_department] : null,
    }, { onConflict: 'event_id' })

  if (constraintError) {
    return { error: constraintError.message }
  }

  revalidatePath('/teacher/dashboard')
  return { success: true }
}

export async function getTeacherDrafts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: drafts, error } = await supabase
    .from('events')
    .select(`
      id, title, description, club_name, location, event_date, end_time, registration_deadline,
      max_capacity, waitlist_max, status, approval_status, feedback_config, targeted_department,
      banner_url, is_public, event_category, is_compulsory, custom_background,
      event_type, team_formation_enabled, min_team_members, max_team_members, created_at,
      event_constraints (allowed_semesters, allowed_years)
    `)
    .eq('created_by', user.id)
    .eq('approval_status', 'draft')
    .order('created_at', { ascending: false })

  if (error || !drafts) return []

  return drafts.map(d => {
    const constraints = Array.isArray(d.event_constraints)
      ? d.event_constraints[0]
      : d.event_constraints

    return {
      id: d.id,
      savedAt: d.created_at,
      title: d.title,
      description: d.description || '',
      selectedCategory: d.event_category || 'faculty',
      eventDate: d.event_date,
      endTime: d.end_time || '',
      deadline: d.registration_deadline || '',
      location: d.location || '',
      bannerUrl: d.banner_url || '',
      isPublic: !!d.is_public,
      isCompulsory: !!d.is_compulsory,
      semesters: (constraints as any)?.allowed_semesters || [],
      years: (constraints as any)?.allowed_years || [],
      targetedDepartment: d.targeted_department || '',
      eventType: d.event_type || 'general',
      teamFormationEnabled: !!d.team_formation_enabled,
      minTeamMembers: d.min_team_members || 2,
      maxTeamMembers: d.max_team_members || 4,
      capacity: d.max_capacity !== null ? String(d.max_capacity) : '',
      waitlistMax: d.waitlist_max !== null ? String(d.waitlist_max) : '',
      customBackground: d.custom_background || '',
    }
  })
}

export async function deleteTeacherDraft(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)
    .eq('approval_status', 'draft')

  if (error) return { error: error.message }
  revalidatePath('/teacher/dashboard')
  return { success: true }
}

export async function updateFacultyEvent(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, department')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'hod', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Only Faculty or Admin can update events.' }
  }

  const { data: event } = await supabase
    .from('events')
    .select('created_by, approval_status')
    .eq('id', id)
    .single()

  if (!event) return { error: 'Event not found' }

  // Allow update if user is the creator OR is faculty/admin
  const canUpdate = event.created_by === user.id || ['teacher', 'hod', 'admin'].includes(profile.role)
  if (!canUpdate) {
    return { error: 'Unauthorized to update this event.' }
  }

  const title = (formData.get('title') as string)?.trim()
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
  const targeted_department = (formData.get('targetedDepartment') as string) || profile.department || null
  const event_category = (formData.get('eventCategory') as string) || 'faculty'
  const guest_name = (formData.get('guestName') as string)?.trim() || null
  const is_public = formData.get('isPublic') === 'true'
  const is_compulsory = formData.get('isCompulsory') === 'true'

  const event_type = (formData.get('eventType') as string) || 'general'
  const team_formation_enabled = formData.get('teamFormationEnabled') === 'true'
  const minCapStr = formData.get('minTeamMembers') as string
  const min_team_members = minCapStr ? parseInt(minCapStr) : 2
  const maxCapStr = formData.get('maxTeamMembers') as string
  const max_team_members = maxCapStr ? parseInt(maxCapStr) : 4
  const locationLatStr = formData.get('locationLat') as string | null
  const locationLngStr = formData.get('locationLng') as string | null
  const location_lat = locationLatStr ? parseFloat(locationLatStr) : null
  const location_lng = locationLngStr ? parseFloat(locationLngStr) : null

  if (venueId && event_category !== 'industrial_visit') {
    const { data: venue } = await supabase.from('venues').select('name').eq('id', venueId).single()
    if (venue) location = venue.name
  }

  // Parse semesters/years
  let allowed_semesters: number[] | null = null
  let allowed_years: number[] | null = null
  try {
    const rawSems = formData.get('semesters') as string
    const rawYears = formData.get('years') as string
    const parsedSems = rawSems ? JSON.parse(rawSems) : []
    const parsedYears = rawYears ? JSON.parse(rawYears) : []
    allowed_semesters = parsedSems.length > 0 ? parsedSems : null
    allowed_years = parsedYears.length > 0 ? parsedYears : null
  } catch {
    // ignore
  }

  const club_name = guest_name
    ? `Guest Lecture — ${guest_name}`
    : event_category === 'faculty'
    ? 'Faculty Initiative'
    : event_category === 'industrial_visit'
    ? 'Industrial Visit'
    : event_category.charAt(0).toUpperCase() + event_category.slice(1)

  const submitForReviewVal = formData.get('submitForReview')
  const isSubmission = submitForReviewVal === 'true'
  const approval_status = submitForReviewVal !== null 
    ? (isSubmission ? 'pending_hod' : 'draft')
    : event.approval_status

  if (isSubmission && (!title || !description || !location || !event_date || !deadlineStr)) {
    return { error: 'Missing required fields for submission.' }
  }

  const eventDt = event_date ? new Date(event_date) : new Date()
  const deadlineDt = deadlineStr ? new Date(deadlineStr) : null

  if (isSubmission && deadlineDt && deadlineDt >= eventDt) {
    return { error: 'Registration deadline must be before the event date.' }
  }

  const updatePayload: any = {
    title: title || 'Untitled Event',
    club_name,
    description,
    location,
    event_date: eventDt.toISOString(),
    end_time: endTimeStr ? new Date(endTimeStr).toISOString() : null,
    venue_id: venueId,
    registration_deadline: deadlineDt ? deadlineDt.toISOString() : null,
    max_capacity,
    waitlist_max,
    banner_url,
    custom_background,
    approval_status,
    targeted_department,
    is_public,
    event_category,
    is_compulsory,
    ...(location_lat !== null && location_lng !== null ? { location_lat, location_lng } : {}),
    event_type,
    team_formation_enabled,
    min_team_members,
    max_team_members
  }

  const { error: updateError } = await supabase
    .from('events')
    .update(updatePayload)
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  const { error: constraintError } = await supabase
    .from('event_constraints')
    .upsert({
      event_id: id,
      allowed_semesters,
      allowed_years,
      allowed_departments: targeted_department ? [targeted_department] : null,
    }, { onConflict: 'event_id' })

  if (constraintError) return { error: constraintError.message }

  revalidatePath('/teacher/dashboard')
  revalidatePath(`/teacher/verify/${id}`)
  revalidatePath(`/teacher/events/${id}/edit`)
  return { success: true }
}

