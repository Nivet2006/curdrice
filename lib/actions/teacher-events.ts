'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logMutation } from '@/lib/audit/log-mutation'

export async function createFacultyEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Only teacher or admin can create faculty events
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, department')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Only Faculty (Teacher) can create faculty events.' }
  }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const location = (formData.get('location') as string)?.trim()
  const event_date = formData.get('eventDate') as string
  const deadlineStr = formData.get('deadline') as string
  const banner_url = (formData.get('bannerUrl') as string)?.trim() || null
  const custom_background = (formData.get('customBackground') as string) || null
  const capStr = formData.get('capacity') as string
  const max_capacity = capStr && parseInt(capStr) > 0 ? parseInt(capStr) : null
  const targeted_department = (formData.get('targetedDepartment') as string) || profile.department || null
  const event_category = (formData.get('eventCategory') as string) || 'faculty'
  const guest_name = (formData.get('guestName') as string)?.trim() || null
  const is_public = formData.get('isPublic') === 'true'
  const is_compulsory = formData.get('isCompulsory') === 'true'
  const locationLatStr = formData.get('locationLat') as string | null
  const locationLngStr = formData.get('locationLng') as string | null
  const location_lat = locationLatStr ? parseFloat(locationLatStr) : null
  const location_lng = locationLngStr ? parseFloat(locationLngStr) : null

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

  // club_name derived from event_category for faculty events
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

  // Venue conflict check (±4 hours) — skip for industrial visits (external location)
  if (event_category !== 'industrial_visit') {
    const fourHoursMs = 4 * 60 * 60 * 1000
    const startTime = new Date(eventDt.getTime() - fourHoursMs).toISOString()
    const endTime = new Date(eventDt.getTime() + fourHoursMs).toISOString()

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

  // Faculty events skip teacher review — go straight to pending_hod
  const approval_status = 'pending_hod'

  const { data: event, error: insertError } = await supabase
    .from('events')
    .insert({
      title,
      club_name,
      description,
      location,
      event_date: eventDt.toISOString(),
      registration_deadline: deadlineDt.toISOString(),
      max_capacity,
      banner_url,
      custom_background,
      created_by: user.id,
      approval_status,
      targeted_department,
      feedback_config: [],
      is_public,
      status: 'upcoming',
      event_category,
      assigned_faculty_id: user.id,
      is_compulsory,
      ...(location_lat !== null && location_lng !== null ? { location_lat, location_lng } : {}),
    })
    .select('id')
    .single()

  if (insertError || !event) {
    return { error: insertError?.message || 'Failed to create event. Please check RLS policies.' }
  }

  // Insert constraints — include semesters/years for compulsory events
  const { error: constraintError } = await supabase
    .from('event_constraints')
    .insert({
      event_id: event.id,
      allowed_semesters,
      allowed_years,
      allowed_departments: targeted_department ? [targeted_department] : null,
    })

  if (constraintError) {
    return { error: constraintError.message }
  }

  // Audit log
  await logMutation({
    userId: user.id,
    userEmail: user.email,
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
