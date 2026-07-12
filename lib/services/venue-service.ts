import { createClient } from '@/lib/supabase/server'
import { assertGlobalRole } from '@/lib/services/permission-service'

export class VenueConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VenueConflictError'
  }
}

/**
 * Gets all venues.
 */
export async function getVenues() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name')
  
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Gets all venue availabilities.
 */
export async function getVenueAvailabilities() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venue_availabilities')
    .select('*, venues(name)')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Checks if a venue is available for the given timeslot.
 * Returns { available: boolean, reason?: string }.
 */
export async function checkVenueAvailability(
  venueId: string,
  startTime: Date,
  endTime: Date,
  excludingEventId?: string | null
): Promise<{ 
  available: boolean; 
  status: 'available' | 'locked' | 'unavailable'; 
  message?: string;
  eventName?: string;
  conflictTime?: string;
}> {
  const supabase = await createClient()

  if (startTime >= endTime) {
    return { available: false, status: 'unavailable', message: 'Start time must be before end time.' }
  }

  // 1. Check if the faculty has marked this venue as available for this period
  const dateStr = startTime.toISOString().split('T')[0]
  const { data: availabilities, error: availError } = await supabase
    .from('venue_availabilities')
    .select('*')
    .eq('venue_id', venueId)
    .eq('date', dateStr)

  if (availError) {
    throw new Error(availError.message)
  }

  const isWithinAvailability = (availabilities || []).some(a => {
    const availStart = new Date(`${dateStr}T${a.start_time}`)
    const availEnd = new Date(`${dateStr}T${a.end_time}`)
    return startTime >= availStart && endTime <= availEnd
  })

  if (!isWithinAvailability) {
    return {
      available: false,
      status: 'unavailable',
      message: 'Venue is not available on this date/time. Faculty has not opened availability for this slot.'
    }
  }

  // 2. Check for conflicts (with 1-hour buffer gap before and after)
  let query = supabase
    .from('events')
    .select('id, title, event_date, end_time, venue_id')
    .eq('venue_id', venueId)
    .not('approval_status', 'in', '("rejected","draft")')

  if (excludingEventId) {
    query = query.neq('id', excludingEventId)
  }

  const { data: activeEvents, error: eventsError } = await query

  if (eventsError) {
    throw new Error(eventsError.message)
  }

  const conflictingEvent = (activeEvents || []).find(e => {
    if (!e.end_time) return false
    const eventStart = new Date(e.event_date)
    const eventEnd = new Date(e.end_time)
    
    const blockStart = new Date(eventStart.getTime() - 60 * 60 * 1000)
    const blockEnd = new Date(eventEnd.getTime() + 60 * 60 * 1000)

    return startTime < blockEnd && endTime > blockStart
  })

  if (conflictingEvent) {
    const startStr = new Date(conflictingEvent.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const endStr = new Date(conflictingEvent.end_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return {
      available: false,
      status: 'locked',
      eventName: conflictingEvent.title,
      conflictTime: `${startStr} - ${endStr}`,
      message: `Locked: Booked by event "${conflictingEvent.title}" (${startStr} - ${endStr}) [with 1hr safety gap]`
    }
  }

  return { available: true, status: 'available', message: 'Venue is available for booking.' }
}

/**
 * Creates venue availability slot.
 */
export async function createVenueAvailability(venueId: string, date: string, startTime: string, endTime: string) {
  const { userId } = await assertGlobalRole(['admin', 'teacher', 'hod', 'cc', 'manager'])
  const supabase = await createClient()

  const { error } = await supabase.from('venue_availabilities').insert({
    venue_id: venueId,
    date,
    start_time: startTime,
    end_time: endTime,
    created_by: userId
  })

  if (error) throw new Error(error.message)
}

/**
 * Deletes venue availability slot.
 */
export async function deleteVenueAvailability(id: string) {
  await assertGlobalRole(['admin', 'teacher', 'hod', 'cc', 'manager'])
  const supabase = await createClient()
  const { error } = await supabase
    .from('venue_availabilities')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/**
 * Creates a new venue.
 */
export async function createVenue(name: string, capacity: number | null, description: string | null) {
  await assertGlobalRole(['admin', 'teacher', 'hod', 'cc', 'manager'])
  const supabase = await createClient()

  const { data, error } = await supabase.from('venues').insert({
    name,
    capacity,
    description
  }).select('id, name').single()

  if (error) {
    if (error.code === '23505') {
      throw new VenueConflictError('A venue with this name already exists.')
    }
    throw new Error(error.message)
  }

  return data
}
