'use server'

import { revalidatePath } from 'next/cache'
import * as venueService from '@/lib/services/venue-service'

export async function getVenues() {
  try {
    const venues = await venueService.getVenues()
    return { venues }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getVenueAvailabilities() {
  try {
    const availabilities = await venueService.getVenueAvailabilities()
    return { availabilities }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createVenueAvailability(formData: FormData) {
  try {
    const venue_id = formData.get('venueId') as string
    const date = formData.get('date') as string
    const start_time = formData.get('startTime') as string
    const end_time = formData.get('endTime') as string

    if (!venue_id || !date || !start_time || !end_time) {
      return { error: 'All fields are required.' }
    }

    await venueService.createVenueAvailability(venue_id, date, start_time, end_time)
    revalidatePath('/teacher/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteVenueAvailability(id: string) {
  try {
    await venueService.deleteVenueAvailability(id)
    revalidatePath('/teacher/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getVenuesWithStatus(
  startTimeIso: string | null,
  endTimeIso: string | null,
  excludingEventId?: string | null
) {
  try {
    const venues = await venueService.getVenues()
    if (!startTimeIso || !endTimeIso) {
      return {
        venues: venues.map(v => ({
          ...v,
          status: 'available',
          message: 'Please select event dates to see live availability status.'
        }))
      }
    }

    const startTime = new Date(startTimeIso)
    const endTime = new Date(endTimeIso)

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return { error: 'Invalid start or end time.' }
    }

    if (startTime >= endTime) {
      return { error: 'Start time must be before end time.' }
    }

    const list = []
    for (const v of venues) {
      const res = await venueService.checkVenueAvailability(v.id, startTime, endTime, excludingEventId)
      list.push({
        ...v,
        status: res.status,
        message: res.message || '',
        eventName: res.eventName,
        conflictTime: res.conflictTime
      })
    }

    return { venues: list }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createVenue(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim()
    const capStr = formData.get('capacity') as string
    const capacity = capStr ? parseInt(capStr) : null
    const description = (formData.get('description') as string)?.trim() || null

    if (!name) {
      return { error: 'Venue name is required.' }
    }

    const venue = await venueService.createVenue(name, capacity, description)
    return { success: true, venue }
  } catch (error: any) {
    return { error: error.message }
  }
}
