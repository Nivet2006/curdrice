'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import * as hackathonService from '@/lib/services/hackathon-service'

// 1. Create a new team
export async function createTeam(eventId: string, teamName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const team = await hackathonService.createTeam(eventId, teamName, user.id)
    revalidatePath(`/events/${eventId}`)
    return { success: true, teamId: team.id }
  } catch (error: any) {
    return { error: error.message }
  }
}

// 2. Request to join a team
export async function sendJoinRequest(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    // Fetch eventId dynamically to revalidate correctly
    const { data: team } = await supabase
      .from('hackathon_teams')
      .select('event_id')
      .eq('id', teamId)
      .single()

    await hackathonService.sendJoinRequest(teamId, user.id)
    if (team) revalidatePath(`/events/${team.event_id}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// 3. Respond to join request (Approve/Reject)
export async function respondToRequest(requestId: string, approve: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const team = await hackathonService.respondToRequest(requestId, approve, user.id)
    revalidatePath(`/events/${team.event_id}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// 4. Invite/directly add a registered user
export async function inviteMember(teamId: string, profileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const team = await hackathonService.inviteMember(teamId, profileId, user.id)
    revalidatePath(`/events/${team.event_id}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// 5. Leave team
export async function leaveTeam(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const team = await hackathonService.leaveTeam(teamId, user.id)
    revalidatePath(`/events/${team.event_id}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// 6. Get all data for the event's team portal
export async function getEventTeamsData(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    return await hackathonService.getEventTeamsData(eventId, user.id)
  } catch (error: any) {
    return { error: error.message }
  }
}
