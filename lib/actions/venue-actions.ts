'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getVenues() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name')
  
  if (error) return { error: error.message }
  return { venues: data || [] }
}

export async function getVenueAvailabilities() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venue_availabilities')
    .select('*, venues(name)')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) return { error: error.message }
  return { availabilities: data || [] }
}

export async function createVenueAvailability(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'teacher', 'hod', 'cc', 'manager'].includes(profile.role)) {
    return { error: 'Unauthorized: Requires faculty/staff role.' }
  }

  const venue_id = formData.get('venueId') as string
  const date = formData.get('date') as string
  const start_time = formData.get('startTime') as string
  const end_time = formData.get('endTime') as string

  if (!venue_id || !date || !start_time || !end_time) {
    return { error: 'All fields are required.' }
  }

  const { error } = await supabase.from('venue_availabilities').insert({
    venue_id,
    date,
    start_time,
    end_time,
    created_by: user.id
  })

  if (error) return { error: error.message }

  revalidatePath('/teacher/dashboard')
  return { success: true }
}

export async function deleteVenueAvailability(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('venue_availabilities')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/teacher/dashboard')
  return { success: true }
}

export async function getVenuesWithStatus(
  startTimeIso: string | null,
  endTimeIso: string | null,
  excludingEventId?: string | null
) {
  const supabase = await createClient()

  // Fetch all venues
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('*')
    .order('name')

  if (venuesError || !venues) {
    return { error: venuesError?.message || 'Failed to fetch venues' }
  }

  if (!startTimeIso || !endTimeIso) {
    // If no time is selected yet, return all as available
    return {
      venues: venues.map(v => ({
        ...v,
        status: 'available',
        message: 'Please select event dates to see live availability status.'
      }))
    }
  }

  const reqStart = new Date(startTimeIso)
  const reqEnd = new Date(endTimeIso)

  if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) {
    return { error: 'Invalid start or end time.' }
  }

  if (reqStart >= reqEnd) {
    return { error: 'Start time must be before end time.' }
  }

  // Fetch all events that could conflict (not rejected and not draft)
  let query = supabase
    .from('events')
    .select('id, title, event_date, end_time, venue_id')
    .not('approval_status', 'in', '("rejected","draft")')
    .not('venue_id', 'is', null)

  if (excludingEventId) {
    query = query.neq('id', excludingEventId)
  }

  const { data: activeEvents, error: eventsError } = await query

  if (eventsError) {
    return { error: eventsError.message }
  }

  // Extract date portion for availability check
  const dateStr = reqStart.toISOString().split('T')[0]

  // Fetch availabilities for this date
  const { data: availabilities, error: availError } = await supabase
    .from('venue_availabilities')
    .select('*')
    .eq('date', dateStr)

  if (availError) {
    return { error: availError.message }
  }

  const list = venues.map(venue => {
    // 1. Check if the faculty has marked this venue as available for this period
    // If venue_availabilities table is empty for this venue, check if we want to be strict.
    // Yes: "all the available venues for the week will be given or feeded into the system by faculty"
    const venueAvails = (availabilities || []).filter(a => a.venue_id === venue.id)
    
    // Check if the requested start and end fall completely within any availability slot
    const isWithinAvailability = venueAvails.some(a => {
      // a.start_time & a.end_time are in 'HH:MM:SS' format. Let's parse them with the date.
      const availStart = new Date(`${dateStr}T${a.start_time}`)
      const availEnd = new Date(`${dateStr}T${a.end_time}`)
      return reqStart >= availStart && reqEnd <= availEnd
    })

    if (!isWithinAvailability) {
      return {
        ...venue,
        status: 'unavailable',
        message: `Venue is not available on this date/time. Faculty has not opened availability for this slot.`
      }
    }

    // 2. Check for conflicts (with 1-hour buffer before and after)
    // Overlapping condition: New event [S, E] and booked event [S_e, E_e].
    // Booked blocked window is [S_e - 1h, E_e + 1h].
    // Overlap occurs if S < E_e + 1h AND E > S_e - 1h.
    const conflictingEvent = (activeEvents || []).find(e => {
      if (e.venue_id !== venue.id || !e.end_time) return false
      
      const eventStart = new Date(e.event_date)
      const eventEnd = new Date(e.end_time)
      
      // Calculate buffer boundaries
      const blockStart = new Date(eventStart.getTime() - 60 * 60 * 1000)
      const blockEnd = new Date(eventEnd.getTime() + 60 * 60 * 1000)

      return reqStart < blockEnd && reqEnd > blockStart
    })

    if (conflictingEvent) {
      const startStr = new Date(conflictingEvent.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const endStr = new Date(conflictingEvent.end_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return {
        ...venue,
        status: 'locked',
        eventName: conflictingEvent.title,
        conflictTime: `${startStr} - ${endStr}`,
        message: `Locked: Booked by event "${conflictingEvent.title}" (${startStr} - ${endStr}) [with 1hr safety gap]`
      }
    }

    return {
      ...venue,
      status: 'available',
      message: 'Venue is available for booking.'
    }
  })

  return { venues: list }
}

export async function createVenue(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'teacher', 'hod', 'cc', 'manager'].includes(profile.role)) {
    return { error: 'Unauthorized: Requires faculty or student coordinator role.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const capStr = formData.get('capacity') as string
  const capacity = capStr ? parseInt(capStr) : null
  const description = (formData.get('description') as string)?.trim() || null

  if (!name) {
    return { error: 'Venue name is required.' }
  }

  const { data, error } = await supabase.from('venues').insert({
    name,
    capacity,
    description
  }).select('id, name').single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A venue with this name already exists.' }
    }
    return { error: error.message }
  }

  return { success: true, venue: data }
}

