import { createClient } from '@/lib/supabase/server'

export class IneligibleStudentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IneligibleStudentError'
  }
}

export class RegistrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RegistrationError'
  }
}

interface RegisterForEventInput {
  eventId: string
  studentId: string
}

export async function registerForEvent(input: RegisterForEventInput, actorId: string) {
  const supabase = await createClient()

  // 1. Verify Authorization (Student can only register themselves, unless CC/Admin is enrolling them)
  if (input.studentId !== actorId) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', actorId).single()
    const role = profile?.role
    if (role !== 'admin' && role !== 'manager' && role !== 'teacher' && role !== 'cc') {
      throw new RegistrationError('Unauthorized: You can only register for yourself.')
    }
  }

  // 2. Fetch student demographics for constraints validation
  const { data: student } = await supabase
    .from('profiles')
    .select('semester, year, department')
    .eq('id', input.studentId)
    .single()

  if (!student) throw new RegistrationError('Student profile not found.')

  // 3. Fetch event constraints
  const { data: constraint } = await supabase
    .from('event_constraints')
    .select('allowed_semesters, allowed_years, allowed_departments')
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (constraint) {
    if (
      constraint.allowed_semesters &&
      constraint.allowed_semesters.length > 0 &&
      !constraint.allowed_semesters.includes(student.semester)
    ) {
      throw new IneligibleStudentError(`This event is restricted to Semester ${constraint.allowed_semesters.join(', ')}.`)
    }
    if (
      constraint.allowed_years &&
      constraint.allowed_years.length > 0 &&
      !constraint.allowed_years.includes(student.year)
    ) {
      throw new IneligibleStudentError(`This event is restricted to Year ${constraint.allowed_years.join(', ')}.`)
    }
    if (
      constraint.allowed_departments &&
      constraint.allowed_departments.length > 0 &&
      !constraint.allowed_departments.includes(student.department)
    ) {
      throw new IneligibleStudentError(`This event is for ${constraint.allowed_departments.join(', ')} students only.`)
    }
  }

  const qrToken = crypto.randomUUID()

  // 4. Try RPC for atomic insert
  try {
    const { data: rpcRes, error: rpcError } = await supabase.rpc('register_student_atomic', {
      p_event_id: input.eventId,
      p_student_id: input.studentId,
      p_qr_token: qrToken
    })

    if (!rpcError && rpcRes) {
      if (rpcRes.success === false) {
        throw new RegistrationError(rpcRes.error || 'Registration failed.')
      }

      // Trigger Email Notification
      try {
        const { data: studentInfo } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', input.studentId)
          .single()

        const { data: eventInfo } = await supabase
          .from('events')
          .select('*, venues(name)')
          .eq('id', input.eventId)
          .single()

        if (studentInfo && eventInfo) {
          const { triggerRegistrationConfirmation } = await import('./notification-service')
          await triggerRegistrationConfirmation(
            studentInfo.email,
            input.studentId,
            input.eventId,
            {
              studentName: studentInfo.full_name,
              eventName: eventInfo.title,
              eventDate: eventInfo.date || 'TBD',
              eventTime: eventInfo.start_time || 'TBD',
              venueName: (eventInfo.venues as any)?.name || 'TBD',
              registrationStatus: rpcRes.waitlisted ? 'Waitlisted' : 'Confirmed',
              qrToken: rpcRes.qr_token
            }
          )
        }
      } catch (triggerErr) {
        console.error('Failed to trigger registration email:', triggerErr)
      }

      return {
        success: true,
        waitlisted: rpcRes.waitlisted,
        qrToken: rpcRes.qr_token
      }
    }
    
    // If function doesn't exist (e.g. migration not applied), fallback to non-atomic path
    if (rpcError && (rpcError.code === '42883' || rpcError.message?.includes('does not exist'))) {
      console.warn('register_student_atomic RPC not found, falling back to non-atomic registration')
    } else if (rpcError) {
      throw new RegistrationError(rpcError.message)
    }
  } catch (err: any) {
    if (!(err instanceof RegistrationError) && !(err instanceof IneligibleStudentError)) {
      // If it's a db error but not our custom error, we fallback
    } else {
      throw err
    }
  }

  // 5. Fallback non-atomic implementation
  const { data: event } = await supabase
    .from('events')
    .select('registration_deadline, max_capacity, waitlist_max, is_compulsory, allow_open_registration, registration_stopped')
    .eq('id', input.eventId)
    .single()

  if (!event) throw new RegistrationError('Event not found.')

  if (event.registration_stopped) {
    throw new RegistrationError('Registration has been stopped by the organizer.')
  }

  if (event.is_compulsory && !event.allow_open_registration) {
    throw new RegistrationError('Registration is closed for this selective compulsory event.')
  }

  if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
    throw new RegistrationError('Registration is closed. The deadline has passed.')
  }

  const { count: activeCount } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', input.eventId)
    .eq('is_waitlisted', false)

  const { count: waitlistCount } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', input.eventId)
    .eq('is_waitlisted', true)

  const activeRegs = activeCount || 0
  const waitlistRegs = waitlistCount || 0

  let shouldWaitlist = false
  if (event.max_capacity && event.max_capacity > 0 && activeRegs >= event.max_capacity) {
    const maxWaitlist = event.waitlist_max || 0
    if (maxWaitlist > 0 && waitlistRegs < maxWaitlist) {
      shouldWaitlist = true
    } else {
      throw new RegistrationError('This event is full. No seats remaining.')
    }
  }

  const { error: insertError } = await supabase.from('registrations').insert({
    event_id: input.eventId,
    student_id: input.studentId,
    qr_token: qrToken,
    is_waitlisted: shouldWaitlist
  })

  if (insertError) {
    if (insertError.code === '23505') {
      throw new RegistrationError('You are already registered for this event.')
    }
    throw new RegistrationError(insertError.message)
  }

  // Trigger Email Notification
  try {
    const { data: studentInfo } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', input.studentId)
      .single()

    const { data: eventInfo } = await supabase
      .from('events')
      .select('*, venues(name)')
      .eq('id', input.eventId)
      .single()

    if (studentInfo && eventInfo) {
      const { triggerRegistrationConfirmation } = await import('./notification-service')
      await triggerRegistrationConfirmation(
        studentInfo.email,
        input.studentId,
        input.eventId,
        {
          studentName: studentInfo.full_name,
          eventName: eventInfo.title,
          eventDate: eventInfo.date || 'TBD',
          eventTime: eventInfo.start_time || 'TBD',
          venueName: (eventInfo.venues as any)?.name || 'TBD',
          registrationStatus: shouldWaitlist ? 'Waitlisted' : 'Confirmed',
          qrToken: qrToken
        }
      )
    }
  } catch (triggerErr) {
    console.error('Failed to trigger registration email:', triggerErr)
  }

  return { success: true, waitlisted: shouldWaitlist, qrToken }
}

export async function cancelRegistration(eventId: string, studentId: string, actorId: string) {
  const supabase = await createClient()

  // 1. Verify Authorization
  if (studentId !== actorId) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', actorId).single()
    if (profile?.role !== 'admin' && profile?.role !== 'manager') {
      throw new RegistrationError('Unauthorized: Cannot cancel another student\'s registration.')
    }
  }

  // 2. Check if compulsory
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('is_compulsory')
    .eq('id', eventId)
    .single()

  if (eventError || !event) throw new RegistrationError('Event not found.')
  if (event.is_compulsory) {
    throw new RegistrationError('You cannot cancel registration for a compulsory event.')
  }

  // 3. Delete registration
  const { error: deleteError } = await supabase
    .from('registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('student_id', studentId)

  if (deleteError) throw new RegistrationError(deleteError.message)

  // 4. Remove member from event conversation if group chat exists
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('event_id', eventId)
    .eq('type', 'group')
    .maybeSingle()

  if (conv) {
    await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conv.id)
      .eq('user_id', studentId)
  }
}
