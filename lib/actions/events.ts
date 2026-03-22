'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createEvent(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const club_name = formData.get('clubName') as string
  const status = formData.get('status') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const event_date = formData.get('eventDate') as string
  const deadlineDate = formData.get('deadline') as string
  const registration_deadline = deadlineDate || null
  const capStr = formData.get('capacity') as string
  const max_capacity = capStr && parseInt(capStr) > 0 ? parseInt(capStr) : null
  const banner_url = formData.get('bannerUrl') as string || null

  const semStr = formData.get('semesters') as string
  const yearStr = formData.get('years') as string
  const deptStr = formData.get('departments') as string

  const sems = JSON.parse(semStr || '[]')
  const years = JSON.parse(yearStr || '[]')
  const depts = JSON.parse(deptStr || '[]')

  const { data: event, error } = await supabase.from('events').insert({
    title,
    club_name,
    status,
    description,
    location,
    event_date: new Date(event_date).toISOString(),
    registration_deadline: registration_deadline ? new Date(registration_deadline).toISOString() : null,
    max_capacity,
    banner_url,
    created_by: user.id
  }).select('id').single()

  if (error || !event) return { error: error?.message || 'Failed to create event' }

  const { error: constraintError } = await supabase.from('event_constraints').insert({
    event_id: event.id,
    allowed_semesters: sems.length ? sems : null,
    allowed_years: years.length ? years : null,
    allowed_departments: depts.length ? depts : null
  })

  if (constraintError) return { error: constraintError.message }

  redirect('/manager/dashboard')
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: event } = await supabase.from('events').select('created_by').eq('id', eventId).single()
  
  if (!event) return { error: 'Event not found' }
  if (event.created_by !== user.id && profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const title = formData.get('title') as string
  const club_name = formData.get('clubName') as string
  const status = formData.get('status') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const event_date = formData.get('eventDate') as string
  const deadlineDate = formData.get('deadline') as string
  const registration_deadline = deadlineDate || null
  const capStr = formData.get('capacity') as string
  const max_capacity = capStr && parseInt(capStr) > 0 ? parseInt(capStr) : null
  const banner_url = formData.get('bannerUrl') as string || null

  const semStr = formData.get('semesters') as string
  const yearStr = formData.get('years') as string
  const deptStr = formData.get('departments') as string

  const sems = JSON.parse(semStr || '[]')
  const years = JSON.parse(yearStr || '[]')
  const depts = JSON.parse(deptStr || '[]')

  const { error: updateError } = await supabase.from('events').update({
    title,
    club_name,
    status,
    description,
    location,
    event_date: new Date(event_date).toISOString(),
    registration_deadline: registration_deadline ? new Date(registration_deadline).toISOString() : null,
    max_capacity,
    banner_url
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

  redirect(`/manager/events/${eventId}`)
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: event } = await supabase.from('events').select('created_by').eq('id', eventId).single()
  
  if (!event) return { error: 'Event not found' }
  if (event.created_by !== user.id && profile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return { error: error.message }
  
  redirect('/manager/dashboard')
}

export async function registerForEvent(eventId: string) {
  const { revalidatePath } = await import('next/cache')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Step 1 — Fetch the student's own profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('semester, year, department')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Student profile not found.' }

  // Step 2 — Fetch the event constraints
  const { data: constraint } = await supabase
    .from('event_constraints')
    .select('allowed_semesters, allowed_years, allowed_departments')
    .eq('event_id', eventId)
    .single()

  // Step 3 — Run eligibility checks (only enforce if constraint exists)
  if (constraint) {
    if (
      constraint.allowed_semesters &&
      constraint.allowed_semesters.length > 0 &&
      !constraint.allowed_semesters.includes(profile.semester)
    ) {
      return { error: `Not permitted: This event is restricted to Semester ${constraint.allowed_semesters.join(', ')}. You are in Semester ${profile.semester}.` }
    }

    if (
      constraint.allowed_years &&
      constraint.allowed_years.length > 0 &&
      !constraint.allowed_years.includes(profile.year)
    ) {
      return { error: `Not permitted: This event is restricted to Year ${constraint.allowed_years.join(', ')}. You are in Year ${profile.year}.` }
    }

    if (
      constraint.allowed_departments &&
      constraint.allowed_departments.length > 0 &&
      !constraint.allowed_departments.includes(profile.department)
    ) {
      return { error: `Not permitted: This event is for ${constraint.allowed_departments.join(', ')} students only. You are in ${profile.department}.` }
    }
  }

  // Step 4 — Check registration deadline
  const { data: event } = await supabase
    .from('events')
    .select('registration_deadline, max_capacity')
    .eq('id', eventId)
    .single()

  if (event?.registration_deadline) {
    if (new Date() > new Date(event.registration_deadline)) {
      return { error: 'Registration is closed. The deadline has passed.' }
    }
  }

  // Step 5 — Check capacity
  if (event?.max_capacity) {
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)

    if (count !== null && count >= event.max_capacity) {
      return { error: 'This event is full. No seats remaining.' }
    }
  }

  // Step 6 — All checks passed, insert registration
  const { error } = await supabase.from('registrations').insert({
    event_id: eventId,
    student_id: user.id,
    qr_token: crypto.randomUUID()
  })

  if (error) {
    if (error.code === '23505') return { error: 'You are already registered for this event.' }
    return { error: error.message }
  }

  revalidatePath(`/student/events/${eventId}`)
  return { success: true }
}
