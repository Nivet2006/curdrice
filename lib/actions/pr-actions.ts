'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, cache: 'no-store' })
      }
    }
  )
}

// ============================================
// Report Review Actions
// ============================================

export async function processReportReview(reportId: string, decision: 'approve' | 'reject', feedback: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'pr' && profile?.role !== 'admin') {
    return { error: 'Unauthorized: Requires PR permissions.' }
  }

  const status = decision === 'approve' ? 'completed' : 'draft'

  const { error } = await supabase
    .from('reports')
    .update({ 
      status, 
    })
    .eq('id', reportId)

  if (error) return { error: error.message }

  if (decision === 'reject') {
    await supabase.from('report_markups').insert({
       report_id: reportId,
       author_id: user.id,
       section_key: 'general_review',
       comment: feedback
    })
  }

  revalidatePath('/pr/dashboard')
  revalidatePath('/pr/audit')
  redirect('/pr/audit')
}

export async function declineReportWithAnnotations(
  reportId: string,
  annotations: { section: string; comment: string }[],
  globalFeedback: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'pr' && profile?.role !== 'admin') {
    return { error: 'Unauthorized: Requires PR permissions.' }
  }

  const annotationsWithMeta = annotations.map(a => ({
    ...a,
    author_id: user.id,
    created_at: new Date().toISOString()
  }))

  const adminClient = getAdminClient()

  const { error } = await adminClient
    .from('reports')
    .update({
      status: 'declined_pr',
      decline_annotations: annotationsWithMeta,
      declined_by: user.id,
      declined_at: new Date().toISOString()
    })
    .eq('id', reportId)

  if (error) return { error: error.message }

  // Also insert markup records for each annotation
  if (globalFeedback) {
    await adminClient.from('report_markups').insert({
      report_id: reportId,
      author_id: user.id,
      section_key: 'decline_global',
      comment: globalFeedback
    })
  }

  for (const annotation of annotations) {
    await adminClient.from('report_markups').insert({
      report_id: reportId,
      author_id: user.id,
      section_key: annotation.section,
      comment: annotation.comment
    })
  }

  revalidatePath('/pr/dashboard')
  revalidatePath('/pr/audit')
  redirect('/pr/audit')
}

// ============================================
// Assignment-Gated Attendance Actions
// ============================================

async function validatePRAssignment(prUserId: string, eventId: string): Promise<boolean> {
  const adminClient = getAdminClient()
  const { data } = await adminClient
    .from('pr_event_assignments')
    .select('id')
    .eq('pr_id', prUserId)
    .eq('event_id', eventId)
    .single()
  return !!data
}

export async function prLookupQRToken(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = getAdminClient()

  // Find registration by QR token
  let cleanToken = token
  const tokenMatch = token.match(/token=([a-zA-Z0-9-]+)/)
  if (tokenMatch) cleanToken = tokenMatch[1]

  const { data: registration, error } = await adminClient
    .from('registrations')
    .select('id, checked_in, checked_in_at, student_id, event_id')
    .eq('qr_token', cleanToken)
    .single()

  if (error || !registration) {
    return { error: 'Invalid QR code. No matching registration found.' }
  }

  // Check assignment gate
  const isAssigned = await validatePRAssignment(user.id, registration.event_id)
  if (!isAssigned) {
    return { error: 'Access denied: contact faculty. You are not assigned to this event.' }
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, usn, department, semester, year')
    .eq('id', registration.student_id)
    .single()

  const { data: event } = await adminClient
    .from('events')
    .select('title, event_date, location')
    .eq('id', registration.event_id)
    .single()

  return {
    success: true,
    registrationId: registration.id,
    eventId: registration.event_id,
    alreadyCheckedIn: registration.checked_in,
    checkedInAt: registration.checked_in_at,
    student: {
      name: profile?.full_name || 'Unknown',
      usn: profile?.usn || 'Unknown',
      department: profile?.department || 'Unknown',
      semester: profile?.semester || '-',
      year: profile?.year || '-',
    },
    event: {
      title: event?.title || 'Unknown Event',
      date: event?.event_date || null,
      location: event?.location || 'TBA',
    }
  }
}

export async function prConfirmCheckIn(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = getAdminClient()

  // Get event_id from registration to validate assignment
  const { data: reg } = await adminClient
    .from('registrations')
    .select('event_id')
    .eq('id', registrationId)
    .single()

  if (!reg) return { error: 'Registration not found' }

  const isAssigned = await validatePRAssignment(user.id, reg.event_id)
  if (!isAssigned) {
    return { error: 'Access denied: contact faculty. You are not assigned to this event.' }
  }

  const { error } = await adminClient
    .from('registrations')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString()
    })
    .eq('id', registrationId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function prManualCheckInByUSN(usn: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Validate PR assignment
  const isAssigned = await validatePRAssignment(user.id, eventId)
  if (!isAssigned) {
    return { error: 'Access denied: contact faculty. You are not assigned to this event.' }
  }

  const adminClient = getAdminClient()

  // Find student by USN
  const { data: student } = await adminClient
    .from('profiles')
    .select('id, full_name, usn, department, semester, year')
    .eq('usn', usn.toUpperCase().trim())
    .single()

  if (!student) return { error: `No student found with USN: ${usn}` }

  // Find their registration for this event
  const { data: registration } = await adminClient
    .from('registrations')
    .select('id, checked_in, checked_in_at')
    .eq('student_id', student.id)
    .eq('event_id', eventId)
    .single()

  if (!registration) return { error: `${student.full_name} (${usn}) is not registered for this event.` }
  if (registration.checked_in) {
    return { 
      error: `${student.full_name} is already checked in at ${registration.checked_in_at ? new Date(registration.checked_in_at).toLocaleTimeString() : 'unknown time'}` 
    }
  }

  const { error } = await adminClient
    .from('registrations')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString()
    })
    .eq('id', registration.id)

  if (error) return { error: error.message }

  return {
    success: true,
    studentName: student.full_name,
    studentUsn: student.usn,
    department: student.department
  }
}

// ============================================
// PR Data Fetching Actions
// ============================================

export async function getPRAssignedEvents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', data: [] }

  const adminClient = getAdminClient()

  // Get all event IDs assigned to this PR
  const { data: assignments } = await adminClient
    .from('pr_event_assignments')
    .select('event_id')
    .eq('pr_id', user.id)

  if (!assignments || assignments.length === 0) return { data: [] }

  const eventIds = assignments.map((a: { event_id: string }) => a.event_id)

  // Fetch full event data
  const { data: events } = await adminClient
    .from('events')
    .select('*')
    .in('id', eventIds)
    .order('event_date', { ascending: false })

  // For each event, get registration and attendance counts
  const eventsWithCounts = await Promise.all(
    (events || []).map(async (event: Record<string, unknown>) => {
      const { count: registrationCount } = await adminClient
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)

      const { count: attendanceCount } = await adminClient
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('checked_in', true)

      return {
        ...event,
        registration_count: registrationCount || 0,
        attendance_count: attendanceCount || 0
      }
    })
  )

  return { data: eventsWithCounts }
}

export async function getEventAttendees(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', data: [] }

  // Validate assignment
  const isAssigned = await validatePRAssignment(user.id, eventId)
  if (!isAssigned) {
    return { error: 'Access denied: contact faculty', data: [] }
  }

  const adminClient = getAdminClient()

  const { data: registrations } = await adminClient
    .from('registrations')
    .select('id, checked_in, checked_in_at, registered_at, student_id')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true })

  if (!registrations || registrations.length === 0) return { data: [] }

  const studentIds = registrations.map((r: { student_id: string }) => r.student_id)
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, usn, department, semester, year')
    .in('id', studentIds)

  const profileMap = new Map((profiles || []).map((p: { id: string }) => [p.id, p]))

  const attendees = registrations.map((r: Record<string, unknown>) => {
    const profile = profileMap.get(r.student_id as string) as Record<string, unknown> | undefined
    return {
      id: r.id,
      full_name: profile?.full_name || 'Unknown',
      usn: profile?.usn || 'Unknown',
      department: profile?.department || 'Unknown',
      semester: profile?.semester || '-',
      year: profile?.year || '-',
      checked_in: r.checked_in,
      checked_in_at: r.checked_in_at,
      registered_at: r.registered_at,
    }
  })

  return { data: attendees }
}
