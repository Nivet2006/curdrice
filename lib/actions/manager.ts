'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkInAttendee(qrToken: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: registration, error: fetchError } = await supabase
    .from('registrations')
    .select('*, events(created_by, title), profiles(full_name, usn)')
    .eq('qr_token', qrToken)
    .single()

  if (fetchError || !registration) return { error: 'Invalid or unknown ticket' }
  if (registration.checked_in) return { error: 'Attendee is already checked in' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  const isOwner = (registration.events as unknown as { created_by: string }).created_by === user.id

  if (!isAdmin && !isOwner) {
    return { error: 'You do not have permission to check in attendees for this event' }
  }

  const { error: updateError } = await supabase
    .from('registrations')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', registration.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/manager/scanner')
  return { 
    success: true, 
    studentName: (registration.profiles as unknown as { full_name: string }).full_name,
    studentUsn: (registration.profiles as unknown as { usn: string }).usn,
    eventTitle: (registration.events as unknown as { title: string }).title 
  }
}

export async function lookupQRToken(token: string) {
  try {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
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

    const { data: registration, error } = await supabaseAdmin
      .from('registrations')
      .select('id, checked_in, checked_in_at, student_id, event_id')
      .eq('qr_token', token)
      .single()

    if (error || !registration) {
      return { error: 'Invalid QR code. No matching registration found.' }
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, usn, department, semester, year')
      .eq('id', registration.student_id)
      .single()

    const { data: event } = await supabaseAdmin
      .from('events')
      .select('title, event_date, location')
      .eq('id', registration.event_id)
      .single()

    return {
      success: true,
      registrationId: registration.id,
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
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Lookup failed' }
  }
}

export async function confirmCheckIn(registrationId: string) {
  try {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
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

    const { error } = await supabaseAdmin
      .from('registrations')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString()
      })
      .eq('id', registrationId)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Check-in failed' }
  }
}

