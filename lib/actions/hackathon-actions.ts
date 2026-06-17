'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Create a new team
export async function createTeam(eventId: string, teamName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const trimmedName = teamName.trim()
  if (!trimmedName) return { error: 'Team name cannot be empty.' }

  // Check if team formation/creation is enabled
  const { data: event } = await supabase
    .from('events')
    .select('team_formation_enabled, team_creation_enabled')
    .eq('id', eventId)
    .single()

  if (event && event.team_formation_enabled === false) {
    return { error: 'Team formation is not enabled for this event.' }
  }
  if (event && event.team_creation_enabled === false) {
    return { error: 'Team creation is currently closed/disabled by the host.' }
  }

  // Check if registered
  const { data: reg } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('student_id', user.id)
    .maybeSingle()

  if (!reg) return { error: 'You must register for the event before forming a team.' }

  // Check if already in a team for this event
  const { data: existingMember } = await supabase
    .from('hackathon_team_members')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', user.id)

  const inTeamForThisEvent = (existingMember || []).some((m: any) => m.team?.event_id === eventId)
  if (inTeamForThisEvent) {
    return { error: 'You are already in a team for this event.' }
  }

  // Create team
  const { data: team, error: createError } = await supabase
    .from('hackathon_teams')
    .insert({
      event_id: eventId,
      team_name: trimmedName,
      leader_id: user.id
    })
    .select('*')
    .single()

  if (createError) {
    if (createError.code === '23505') {
      return { error: 'A team with this name already exists for this event.' }
    }
    return { error: createError.message }
  }

  // Add leader as member
  await supabase.from('hackathon_team_members').insert({
    team_id: team.id,
    profile_id: user.id
  })

  // Cancel any pending join requests this user has sent for this event
  const { data: userRequests } = await supabase
    .from('hackathon_team_requests')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', user.id)

  const requestsToCancel = (userRequests || [])
    .filter((r: any) => r.team?.event_id === eventId)
    .map((r: any) => r.id)

  if (requestsToCancel.length > 0) {
    await supabase.from('hackathon_team_requests').delete().in('id', requestsToCancel)
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true, teamId: team.id }
}

// 2. Request to join a team
export async function sendJoinRequest(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch team info
  const { data: team } = await supabase
    .from('hackathon_teams')
    .select('event_id, event:events(team_join_requests_enabled)')
    .eq('id', teamId)
    .single()

  if (!team) return { error: 'Team not found.' }

  const eventSettings = (team as any).event
  if (eventSettings && eventSettings.team_join_requests_enabled === false) {
    return { error: 'Sending join requests is currently closed/disabled by the host.' }
  }

  // Check registration
  const { data: reg } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', team.event_id)
    .eq('student_id', user.id)
    .maybeSingle()

  if (!reg) return { error: 'You must register for this event to request joining a team.' }

  // Check if already in a team
  const { data: existingMember } = await supabase
    .from('hackathon_team_members')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', user.id)

  const inTeam = (existingMember || []).some((m: any) => m.team?.event_id === team.event_id)
  if (inTeam) return { error: 'You are already in a team for this event.' }

  // Insert request
  const { error } = await supabase.from('hackathon_team_requests').insert({
    team_id: teamId,
    profile_id: user.id,
    status: 'pending'
  })

  if (error) {
    if (error.code === '23505') return { error: 'You have already sent a request to this team.' }
    return { error: error.message }
  }

  revalidatePath(`/events/${team.event_id}`)
  return { success: true }
}

// 3. Respond to join request (Approve/Reject)
export async function respondToRequest(requestId: string, approve: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch request and associated team data
  const { data: request } = await supabase
    .from('hackathon_team_requests')
    .select('*, team:hackathon_teams(*, event:events(*))')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Request not found.' }

  const team = request.team
  if (team.leader_id !== user.id) return { error: 'Only the team leader can manage requests.' }

  if (!approve) {
    // Delete/reject request
    await supabase.from('hackathon_team_requests').delete().eq('id', requestId)
    revalidatePath(`/events/${team.event_id}`)
    return { success: true }
  }

  // Check if team join requests are enabled
  if (team.event && team.event.team_join_requests_enabled === false) {
    return { error: 'Approving join requests is currently closed/disabled by the host.' }
  }

  // Check max members
  const { count: memberCount } = await supabase
    .from('hackathon_team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', team.id)

  const maxLimit = team.event?.max_team_members || 4
  if ((memberCount || 0) >= maxLimit) {
    return { error: `This team has reached its limit of ${maxLimit} members.` }
  }

  // Add to members
  const { error: joinError } = await supabase.from('hackathon_team_members').insert({
    team_id: team.id,
    profile_id: request.profile_id
  })

  if (joinError) return { error: joinError.message }

  // Delete this request
  await supabase.from('hackathon_team_requests').delete().eq('id', requestId)

  // Cancel any other requests this user has sent for this event
  const { data: userRequests } = await supabase
    .from('hackathon_team_requests')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', request.profile_id)

  const requestsToCancel = (userRequests || [])
    .filter((r: any) => r.team?.event_id === team.event_id)
    .map((r: any) => r.id)

  if (requestsToCancel.length > 0) {
    await supabase.from('hackathon_team_requests').delete().in('id', requestsToCancel)
  }

  revalidatePath(`/events/${team.event_id}`)
  return { success: true }
}

// 4. Invite/directly add a registered user who is team-less
export async function inviteMember(teamId: string, profileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch team info
  const { data: team } = await supabase
    .from('hackathon_teams')
    .select('*, event:events(*)')
    .eq('id', teamId)
    .single()

  if (!team) return { error: 'Team not found.' }
  if (team.event && team.event.team_invites_enabled === false) {
    return { error: 'Direct invitations are currently closed/disabled by the host.' }
  }
  if (team.leader_id !== user.id) return { error: 'Only the team leader can add members.' }

  // Check if invitee is registered
  const { data: reg } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', team.event_id)
    .eq('student_id', profileId)
    .maybeSingle()

  if (!reg) return { error: 'This user is not registered for the event.' }

  // Check if already in a team
  const { data: existingMember } = await supabase
    .from('hackathon_team_members')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', profileId)

  const inTeam = (existingMember || []).some((m: any) => m.team?.event_id === team.event_id)
  if (inTeam) return { error: 'This user is already in a team.' }

  // Check max members
  const { count: memberCount } = await supabase
    .from('hackathon_team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)

  const maxLimit = team.event?.max_team_members || 4
  if ((memberCount || 0) >= maxLimit) {
    return { error: `This team has reached its limit of ${maxLimit} members.` }
  }

  // Insert membership directly
  await supabase.from('hackathon_team_members').insert({
    team_id: teamId,
    profile_id: profileId
  })

  // Cancel any requests this user sent for this event
  const { data: userRequests } = await supabase
    .from('hackathon_team_requests')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', profileId)

  const requestsToCancel = (userRequests || [])
    .filter((r: any) => r.team?.event_id === team.event_id)
    .map((r: any) => r.id)

  if (requestsToCancel.length > 0) {
    await supabase.from('hackathon_team_requests').delete().in('id', requestsToCancel)
  }

  revalidatePath(`/events/${team.event_id}`)
  return { success: true }
}

// 5. Leave team
export async function leaveTeam(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch team info
  const { data: team } = await supabase
    .from('hackathon_teams')
    .select('*, event:events(team_deletion_enabled)')
    .eq('id', teamId)
    .single()

  if (!team) return { error: 'Team not found.' }

  const eventSettings = (team as any).event
  if (eventSettings && eventSettings.team_deletion_enabled === false) {
    return { error: 'Leaving or deleting teams is currently closed/disabled by the host.' }
  }

  if (team.leader_id === user.id) {
    // If leader leaves, delete the team entirely
    await supabase.from('hackathon_teams').delete().eq('id', teamId)
  } else {
    // Remove membership
    await supabase
      .from('hackathon_team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('profile_id', user.id)
  }

  revalidatePath(`/events/${team.event_id}`)
  return { success: true }
}

// 6. Get all data for the event's team portal
export async function getEventTeamsData(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  // Get all teams for the event
  const { data: teams } = await supabase
    .from('hackathon_teams')
    .select('*, leader:profiles(id, full_name, usn)')
    .eq('event_id', eventId)

  // Get all memberships for these teams
  const teamIds = (teams || []).map(t => t.id)
  let memberships: any[] = []
  let requests: any[] = []

  if (teamIds.length > 0) {
    const [mRes, rRes] = await Promise.all([
      supabase
        .from('hackathon_team_members')
        .select('*, profile:profiles(id, full_name, usn, department)')
        .in('team_id', teamIds),
      supabase
        .from('hackathon_team_requests')
        .select('*, profile:profiles(id, full_name, usn, department)')
        .in('team_id', teamIds)
    ])
    memberships = mRes.data || []
    requests = rRes.data || []
  }

  // Get all registered students for the event
  const { data: registrations } = await supabase
    .from('registrations')
    .select('student_id, profiles(id, full_name, usn, department)')
    .eq('event_id', eventId)

  const registeredProfiles = (registrations || []).map((r: any) => r.profiles).filter(Boolean)

  // Find users already in teams
  const userIdsInTeams = new Set(memberships.map(m => m.profile_id))

  // Users registered who are not in any team
  const teamLessStudents = registeredProfiles.filter(p => !userIdsInTeams.has(p.id))

  // User's specific team context
  const myMembership = memberships.find(m => m.profile_id === user.id)
  const myTeam = myMembership ? teams?.find(t => t.id === myMembership.team_id) : null
  const myTeamMembers = myTeam ? memberships.filter(m => m.team_id === myTeam.id) : []
  const myTeamRequests = myTeam && myTeam.leader_id === user.id ? requests.filter(r => r.team_id === myTeam.id) : []

  // Sent requests context
  const mySentRequests = requests.filter(r => r.profile_id === user.id).map(r => ({
    ...r,
    team: teams?.find(t => t.id === r.team_id)
  }))

  return {
    event,
    teams: teams || [],
    memberships,
    teamLessStudents,
    myTeam,
    myTeamMembers,
    myTeamRequests,
    mySentRequests
  }
}
