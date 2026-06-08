'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role, department').eq('id', user.id).single()

  const title = (formData.get('title') as string)?.trim()
  const club_name = (formData.get('clubName') as string)?.trim()
  const status = formData.get('status') as string
  const description = (formData.get('description') as string)?.trim()
  const location = (formData.get('location') as string)?.trim()
  const event_date = formData.get('eventDate') as string
  const deadlineStr = formData.get('deadline') as string
  const banner_url = (formData.get('bannerUrl') as string)?.trim() || null
  const capStr = formData.get('capacity') as string
  const max_capacity = capStr && parseInt(capStr) > 0 ? parseInt(capStr) : null
  const waitlistCapStr = formData.get('waitlistMax') as string
  const waitlist_max = waitlistCapStr && parseInt(waitlistCapStr) > 0 ? parseInt(waitlistCapStr) : 0

  const event_category = (formData.get('eventCategory') as string) || 'standard'
  const is_compulsory = formData.get('isCompulsory') === 'true'
  const allow_open_registration = formData.get('allowOpenRegistration') === 'true'
  const assigned_faculty_id = (formData.get('assignedFacultyId') as string) || null

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

  const { data: event, error } = await supabase.from('events').insert({
    title, club_name, status, description, location,
    event_date: eventDt.toISOString(),
    registration_deadline: deadlineDt.toISOString(),
    max_capacity, banner_url, waitlist_max,
    created_by: user.id,
    event_category,
    is_compulsory,
    allow_open_registration,
    assigned_faculty_id,
    approval_status: profile?.role === 'teacher' ? 'pending_hod' : 'draft',
    targeted_department: profile?.role === 'teacher' ? (profile?.department || null) : null
  }).select('id').single()

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
  if (profile?.role !== 'admin' && profile?.role !== 'manager' && !(profile?.role === 'teacher' && event.created_by === user.id)) {
    return { error: 'Unauthorized' }
  }

  const title = (formData.get('title') as string)?.trim()
  const club_name = (formData.get('clubName') as string)?.trim()
  const status = formData.get('status') as string
  const description = (formData.get('description') as string)?.trim()
  const location = (formData.get('location') as string)?.trim()
  const event_date = formData.get('eventDate') as string
  const deadlineStr = formData.get('deadline') as string
  const banner_url = (formData.get('bannerUrl') as string)?.trim() || null
  const capStr = formData.get('capacity') as string
  const max_capacity = capStr && parseInt(capStr) > 0 ? parseInt(capStr) : null
  const waitlistCapStr = formData.get('waitlistMax') as string
  const waitlist_max = waitlistCapStr && parseInt(waitlistCapStr) > 0 ? parseInt(waitlistCapStr) : 0

  const event_category = (formData.get('eventCategory') as string) || 'standard'
  const is_compulsory = formData.get('isCompulsory') === 'true'
  const allow_open_registration = formData.get('allowOpenRegistration') === 'true'
  const assigned_faculty_id = (formData.get('assignedFacultyId') as string) || null

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

  const { error: updateError } = await supabase.from('events').update({
    title, club_name, status, description, location,
    event_date: eventDt.toISOString(),
    registration_deadline: deadlineDt.toISOString(),
    max_capacity, banner_url, waitlist_max,
    event_category,
    is_compulsory,
    allow_open_registration,
    assigned_faculty_id
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

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: event } = await supabase.from('events').select('created_by').eq('id', eventId).single()

  if (!event) return { error: 'Event not found' }
  if (profile?.role !== 'admin' && profile?.role !== 'manager' && !(profile?.role === 'teacher' && event.created_by === user.id)) {
    return { error: 'Unauthorized' }
  }

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('semester, year, department')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Student profile not found.' }

  const { data: constraint } = await supabase
    .from('event_constraints')
    .select('allowed_semesters, allowed_years, allowed_departments')
    .eq('event_id', eventId)
    .single()

  if (constraint) {
    if (
      constraint.allowed_semesters?.length > 0 &&
      !constraint.allowed_semesters.includes(profile.semester)
    ) {
      return { error: `Not permitted: This event is restricted to Semester ${constraint.allowed_semesters.join(', ')}. You are in Semester ${profile.semester}.` }
    }
    if (
      constraint.allowed_years?.length > 0 &&
      !constraint.allowed_years.includes(profile.year)
    ) {
      return { error: `Not permitted: This event is restricted to Year ${constraint.allowed_years.join(', ')}. You are in Year ${profile.year}.` }
    }
    if (
      constraint.allowed_departments?.length > 0 &&
      !constraint.allowed_departments.includes(profile.department)
    ) {
      return { error: `Not permitted: This event is for ${constraint.allowed_departments.join(', ')} students only. You are in ${profile.department}.` }
    }
  }

  const { data: event } = await supabase
    .from('events')
    .select('registration_deadline, max_capacity, waitlist_max, is_compulsory, allow_open_registration')
    .eq('id', eventId)
    .single()

  if (event?.is_compulsory && !event.allow_open_registration) {
    return { error: 'Registration is closed for this selective compulsory event.' }
  }

  if (event?.registration_deadline) {
    if (new Date() > new Date(event.registration_deadline)) {
      return { error: 'Registration is closed. The deadline has passed.' }
    }
  }

  // Count active registrations
  const { count: activeCount } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('is_waitlisted', false)

  // Count waitlisted registrations
  const { count: waitlistCount } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('is_waitlisted', true)

  const activeRegs = activeCount || 0
  const waitlistRegs = waitlistCount || 0

  let shouldWaitlist = false
  if (event?.max_capacity && event.max_capacity > 0 && activeRegs >= event.max_capacity) {
    const maxWaitlist = event.waitlist_max || 0
    if (maxWaitlist > 0 && waitlistRegs < maxWaitlist) {
      shouldWaitlist = true
    } else {
      return { error: 'This event is full. No seats remaining.' }
    }
  }

  const qrToken = crypto.randomUUID()
  const { error } = await supabase.from('registrations').insert({
    event_id: eventId,
    student_id: user.id,
    qr_token: qrToken,
    is_waitlisted: shouldWaitlist
  })

  if (error) {
    if (error.code === '23505') return { error: 'You are already registered for this event.' }
    return { error: error.message }
  }

  // Trigger notification only if NOT waitlisted
  if (!shouldWaitlist) {
    const { createEventNotification } = await import('@/lib/actions/messages')
    await createEventNotification(user.id, eventId, qrToken)

    // Auto-join event discussion thread if enabled
    const { joinEventThread } = await import('@/lib/actions/event-threads')
    await joinEventThread(eventId, user.id)
  }

  revalidatePath(`/student/events/${eventId}`)
  return { success: true, waitlisted: shouldWaitlist }
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