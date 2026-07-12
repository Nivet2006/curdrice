'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as attendanceService from '@/lib/services/attendance-service'

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

  const adminClient = supabaseAdmin

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
  const adminClient = supabaseAdmin
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

  const adminClient = supabaseAdmin

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

  try {
    await attendanceService.markAttendanceById(registrationId, user.id)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function prManualCheckInByUSN(usn: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const res = await attendanceService.markAttendanceManual(eventId, usn, user.id)
    return {
      success: true,
      studentName: res.studentName,
      studentUsn: res.studentUsn,
      department: res.department
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ============================================
// PR Data Fetching Actions
// ============================================

export async function getPRAssignedEvents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', data: [] }

  const adminClient = supabaseAdmin

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
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, banner_url, created_by, created_at, approval_status, discussion_enabled')
    .in('id', eventIds)
    .order('event_date', { ascending: false })

  // Batch fetch registration counts for all events at once
  const { data: allRegs } = eventIds.length > 0
    ? await adminClient
        .from('registrations')
        .select('event_id, checked_in')
        .in('event_id', eventIds)
    : { data: [] }

  // Build count maps in O(n) instead of N queries
  const regCountMap = new Map<string, number>()
  const attendCountMap = new Map<string, number>()
  for (const r of allRegs || []) {
    regCountMap.set(r.event_id, (regCountMap.get(r.event_id) || 0) + 1)
    if (r.checked_in) {
      attendCountMap.set(r.event_id, (attendCountMap.get(r.event_id) || 0) + 1)
    }
  }

  const eventsWithCounts = (events || []).map((event: Record<string, unknown>) => ({
    ...event,
    registration_count: regCountMap.get(event.id as string) || 0,
    attendance_count: attendCountMap.get(event.id as string) || 0
  }))

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

  const adminClient = supabaseAdmin

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

  const attendees = registrations.map((r: { id: string; student_id: string; checked_in: boolean; checked_in_at: string | null; registered_at: string }) => {
    const profile = profileMap.get(r.student_id) as { full_name: string; usn: string; department: string; semester: number; year: number } | undefined
    return {
      id: r.id,
      full_name: profile?.full_name || 'Unknown',
      usn: profile?.usn || 'Unknown',
      department: profile?.department || 'Unknown',
      semester: profile?.semester ?? '-',
      year: profile?.year ?? '-',
      checked_in: r.checked_in,
      checked_in_at: r.checked_in_at,
      registered_at: r.registered_at,
    }
  })

  return { data: attendees }
}
