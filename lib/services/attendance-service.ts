import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/services/permission-service'

/**
 * Validates whether the actor has authority to mark attendance for a specific event.
 * Admins, Teachers, and HODs can always check in anyone.
 * CCs and Managers must be the event creator.
 * PR members must be assigned to the event.
 */
export async function validateAttendanceAuthority(eventId: string, actorId: string, actorRole: string): Promise<boolean> {
  if (['admin', 'teacher', 'hod'].includes(actorRole)) return true

  const supabase = await createClient()

  if (['cc', 'manager'].includes(actorRole)) {
    const { data: event } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single()
    if (event?.created_by === actorId) return true
  }

  if (actorRole === 'pr') {
    const { data: assignment } = await supabase
      .from('pr_event_assignments')
      .select('id')
      .eq('pr_id', actorId)
      .eq('event_id', eventId)
      .maybeSingle()
    if (assignment) return true
  }

  throw new Error('Access denied: You do not have permission to manage attendance for this event.')
}

/**
 * Marks attendance manual using USN.
 */
export async function markAttendanceManual(eventId: string, usn: string, actorId: string) {
  const supabase = await createClient()
  const { profile: actorProfile } = await getUserProfile()
  
  await validateAttendanceAuthority(eventId, actorId, actorProfile.role)

  const { data: student } = await supabase
    .from('profiles')
    .select('id, full_name, usn, department')
    .eq('usn', usn.toUpperCase().trim())
    .single()

  if (!student) {
    throw new Error(`Student with USN ${usn.toUpperCase()} not found.`)
  }

  const { data: registration } = await supabase
    .from('registrations')
    .select('id, checked_in')
    .eq('student_id', student.id)
    .eq('event_id', eventId)
    .single()

  if (!registration) {
    throw new Error(`Student ${student.full_name} (${usn.toUpperCase()}) is not registered for this event.`)
  }

  if (registration.checked_in) {
    throw new Error(`Student ${student.full_name} is already checked in.`)
  }

  const { error } = await supabase
    .from('registrations')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', registration.id)

  if (error) throw new Error(error.message)

  return {
    studentName: student.full_name,
    studentUsn: student.usn,
    department: student.department
  }
}

/**
 * Marks attendance using a QR token.
 */
export async function markAttendanceByQR(qrToken: string, actorId: string) {
  const supabase = await createClient()
  const { profile: actorProfile } = await getUserProfile()

  // Clean the token (it could be a URL like `/scanner?token=...`)
  let cleanToken = qrToken
  const tokenMatch = qrToken.match(/token=([a-zA-Z0-9-]+)/)
  if (tokenMatch) cleanToken = tokenMatch[1]

  const { data: registration } = await supabase
    .from('registrations')
    .select('id, checked_in, student_id, event_id')
    .eq('qr_token', cleanToken)
    .single()

  if (!registration) {
    throw new Error('Invalid QR code. No matching registration found.')
  }

  await validateAttendanceAuthority(registration.event_id, actorId, actorProfile.role)

  if (registration.checked_in) {
    throw new Error('Attendee is already checked in.')
  }

  const { error } = await supabase
    .from('registrations')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', registration.id)

  if (error) throw new Error(error.message)

  const { data: student } = await supabase
    .from('profiles')
    .select('full_name, usn, department')
    .eq('id', registration.student_id)
    .single()

  const { data: event } = await supabase
    .from('events')
    .select('title')
    .eq('id', registration.event_id)
    .single()

  return {
    studentName: student?.full_name || 'Unknown',
    studentUsn: student?.usn || 'Unknown',
    department: student?.department || 'Unknown',
    eventTitle: event?.title || 'Unknown Event'
  }
}

/**
 * Marks attendance directly using a registration ID.
 */
export async function markAttendanceById(registrationId: string, actorId: string) {
  const supabase = await createClient()
  const { profile: actorProfile } = await getUserProfile()

  const { data: reg } = await supabase
    .from('registrations')
    .select('checked_in, event_id')
    .eq('id', registrationId)
    .single()

  if (!reg) throw new Error('Registration not found')

  await validateAttendanceAuthority(reg.event_id, actorId, actorProfile.role)

  if (reg.checked_in) {
    throw new Error('Attendee is already checked in.')
  }

  const { error } = await supabase
    .from('registrations')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', registrationId)

  if (error) throw new Error(error.message)
}
