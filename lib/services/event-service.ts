import { createClient } from '@/lib/supabase/server'
import { checkVenueAvailability } from '@/lib/services/venue-service'
import { assertGlobalRole } from '@/lib/services/permission-service'

export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidStateTransitionError'
  }
}

export class EventNotFoundError extends Error {
  constructor(message = 'Event not found') {
    super(message)
    this.name = 'EventNotFoundError'
  }
}

export interface CreateEventPayload {
  title: string
  club_name: string
  description: string
  location: string
  event_date: string
  end_time: string | null
  venue_id: string | null
  registration_deadline: string
  max_capacity: number | null
  waitlist_max: number
  banner_url: string | null
  custom_background: string | null
  approval_status: string
  targeted_department: string | null
  event_category?: string
  is_public?: boolean
  is_compulsory?: boolean
  event_type?: string
  team_formation_enabled?: boolean
  min_team_members?: number
  max_team_members?: number
  location_lat?: number | null
  location_lng?: number | null
  constraints?: {
    allowed_semesters: number[] | null
    allowed_years: number[] | null
    allowed_departments: string[] | null
  }
}

/**
 * Creates a new event and its constraints atomically.
 */
export async function createEvent(payload: CreateEventPayload, actorId: string) {
  const supabase = await createClient()

  // 1. Verify venue conflict if venue_id is provided
  if (payload.venue_id && payload.end_time) {
    const avail = await checkVenueAvailability(
      payload.venue_id,
      new Date(payload.event_date),
      new Date(payload.end_time)
    )
    if (!avail.available) {
      throw new Error(avail.message || 'Venue conflict detected.')
    }
  }

  // 2. Insert event
  const { data: event, error: insertError } = await supabase
    .from('events')
    .insert({
      title: payload.title,
      club_name: payload.club_name,
      description: payload.description,
      location: payload.location,
      event_date: payload.event_date,
      end_time: payload.end_time,
      venue_id: payload.venue_id,
      registration_deadline: payload.registration_deadline,
      max_capacity: payload.max_capacity,
      waitlist_max: payload.waitlist_max,
      banner_url: payload.banner_url,
      custom_background: payload.custom_background,
      created_by: actorId,
      approval_status: payload.approval_status,
      targeted_department: payload.targeted_department,
      status: 'upcoming',
      event_category: payload.event_category || 'general',
      is_public: payload.is_public ?? true,
      is_compulsory: payload.is_compulsory ?? false,
      event_type: payload.event_type || 'general',
      team_formation_enabled: payload.team_formation_enabled ?? false,
      min_team_members: payload.min_team_members ?? 2,
      max_team_members: payload.max_team_members ?? 4,
      location_lat: payload.location_lat,
      location_lng: payload.location_lng
    })
    .select('id')
    .single()

  if (insertError || !event) {
    throw new Error(insertError?.message || 'Failed to create event.')
  }

  // 3. Insert constraints
  if (payload.constraints) {
    const { error: constraintError } = await supabase
      .from('event_constraints')
      .insert({
        event_id: event.id,
        allowed_semesters: payload.constraints.allowed_semesters,
        allowed_years: payload.constraints.allowed_years,
        allowed_departments: payload.constraints.allowed_departments
      })

    if (constraintError) {
      throw new Error(constraintError.message)
    }
  }

  return event
}

/**
 * Updates an event status (e.g. approve, reject).
 */
export async function updateEventStatus(eventId: string, approvalStatus: string) {
  const supabase = await createClient()

  // Verify permissions
  await assertGlobalRole(['admin', 'teacher', 'hod', 'pr'])

  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('approval_status')
    .eq('id', eventId)
    .single()

  if (fetchError || !event) {
    throw new EventNotFoundError()
  }

  // Prevent transitions that violate constraints (e.g., trying to modify already approved events' status arbitrarily if needed)
  const { error } = await supabase
    .from('events')
    .update({ approval_status: approvalStatus })
    .eq('id', eventId)

  if (error) throw new Error(error.message)
}

/**
 * Updates an existing event draft.
 * Throws InvalidStateTransitionError if the event is already approved.
 */
export async function updateEventDraft(
  eventId: string,
  payload: Partial<CreateEventPayload>,
  actorId: string
) {
  const supabase = await createClient()

  // Fetch current event to check approval status
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('approval_status, created_by')
    .eq('id', eventId)
    .single()

  if (fetchError || !event) {
    throw new EventNotFoundError()
  }

  // Verify authorization (only creator or admin/staff)
  if (event.created_by !== actorId) {
    await assertGlobalRole(['admin'])
  }

  // Business rule check: Prevent editing if already approved
  if (event.approval_status === 'approved') {
    throw new InvalidStateTransitionError('Cannot modify an event that has already been approved.')
  }

  // Venue conflict check if time/venue is updated
  if (payload.venue_id && payload.event_date && payload.end_time) {
    const avail = await checkVenueAvailability(
      payload.venue_id,
      new Date(payload.event_date),
      new Date(payload.end_time),
      eventId
    )
    if (!avail.available) {
      throw new Error(avail.message || 'Venue conflict detected.')
    }
  }

  const updateFields: any = { ...payload }
  delete updateFields.constraints // handled separately

  const { error: updateError } = await supabase
    .from('events')
    .update(updateFields)
    .eq('id', eventId)

  if (updateError) throw new Error(updateError.message)

  if (payload.constraints) {
    const { error: constraintError } = await supabase
      .from('event_constraints')
      .upsert({
        event_id: eventId,
        allowed_semesters: payload.constraints.allowed_semesters,
        allowed_years: payload.constraints.allowed_years,
        allowed_departments: payload.constraints.allowed_departments
      })

    if (constraintError) {
      throw new Error(constraintError.message)
    }
  }
}
