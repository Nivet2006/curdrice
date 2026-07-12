import { createClient } from '@/lib/supabase/server'
import { assertGlobalRole } from '@/lib/services/permission-service'

// 1. Create a new team
export async function createTeam(eventId: string, teamName: string, actorId: string) {
  const supabase = await createClient()

  const trimmedName = teamName.trim()
  if (!trimmedName) throw new Error('Team name cannot be empty.')

  // Check if team formation/creation is enabled
  const { data: event } = await supabase
    .from('events')
    .select('team_formation_enabled, team_creation_enabled')
    .eq('id', eventId)
    .single()

  if (event && event.team_formation_enabled === false) {
    throw new Error('Team formation is not enabled for this event.')
  }
  if (event && event.team_creation_enabled === false) {
    throw new Error('Team creation is currently closed/disabled by the host.')
  }

  // Check if registered
  const { data: reg } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('student_id', actorId)
    .maybeSingle()

  if (!reg) throw new Error('You must register for the event before forming a team.')

  // Check if already in a team for this event
  const { data: existingMember } = await supabase
    .from('hackathon_team_members')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', actorId)

  const inTeamForThisEvent = (existingMember || []).some((m: any) => m.team?.event_id === eventId)
  if (inTeamForThisEvent) {
    throw new Error('You are already in a team for this event.')
  }

  // Create team
  const { data: team, error: createError } = await supabase
    .from('hackathon_teams')
    .insert({
      event_id: eventId,
      team_name: trimmedName,
      leader_id: actorId
    })
    .select('*')
    .single()

  if (createError) {
    if (createError.code === '23505') {
      throw new Error('A team with this name already exists for this event.')
    }
    throw new Error(createError.message)
  }

  // Add leader as member
  await supabase.from('hackathon_team_members').insert({
    team_id: team.id,
    profile_id: actorId
  })

  // Cancel any pending join requests this user has sent for this event
  const { data: userRequests } = await supabase
    .from('hackathon_team_requests')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', actorId)

  const requestsToCancel = (userRequests || [])
    .filter((r: any) => r.team?.event_id === eventId)
    .map((r: any) => r.id)

  if (requestsToCancel.length > 0) {
    await supabase.from('hackathon_team_requests').delete().in('id', requestsToCancel)
  }

  return team
}

// 2. Request to join a team
export async function sendJoinRequest(teamId: string, actorId: string) {
  const supabase = await createClient()

  // Fetch team info
  const { data: team } = await supabase
    .from('hackathon_teams')
    .select('event_id, event:events(team_join_requests_enabled)')
    .eq('id', teamId)
    .single()

  if (!team) throw new Error('Team not found.')

  const eventSettings = (team as any).event
  if (eventSettings && eventSettings.team_join_requests_enabled === false) {
    throw new Error('Sending join requests is currently closed/disabled by the host.')
  }

  // Check registration
  const { data: reg } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', team.event_id)
    .eq('student_id', actorId)
    .maybeSingle()

  if (!reg) throw new Error('You must register for this event to request joining a team.')

  // Check if already in a team
  const { data: existingMember } = await supabase
    .from('hackathon_team_members')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', actorId)

  const inTeam = (existingMember || []).some((m: any) => m.team?.event_id === team.event_id)
  if (inTeam) throw new Error('You are already in a team for this event.')

  // Insert request
  const { error } = await supabase.from('hackathon_team_requests').insert({
    team_id: teamId,
    profile_id: actorId,
    status: 'pending'
  })

  if (error) {
    if (error.code === '23505') throw new Error('You have already sent a request to this team.')
    throw new Error(error.message)
  }
}

// 3. Respond to join request (Approve/Reject)
export async function respondToRequest(requestId: string, approve: boolean, actorId: string) {
  const supabase = await createClient()

  // Fetch request and associated team data
  const { data: request } = await supabase
    .from('hackathon_team_requests')
    .select('*, team:hackathon_teams(*, event:events(*))')
    .eq('id', requestId)
    .single()

  if (!request) throw new Error('Request not found.')

  const team = request.team
  if (team.leader_id !== actorId) throw new Error('Only the team leader can manage requests.')

  if (!approve) {
    // Delete/reject request
    await supabase.from('hackathon_team_requests').delete().eq('id', requestId)
    return team
  }

  // Check if team join requests are enabled
  if (team.event && team.event.team_join_requests_enabled === false) {
    throw new Error('Approving join requests is currently closed/disabled by the host.')
  }

  // Check max members
  const { count: memberCount } = await supabase
    .from('hackathon_team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', team.id)

  const maxLimit = team.event?.max_team_members || 4
  if ((memberCount || 0) >= maxLimit) {
    throw new Error(`This team has reached its limit of ${maxLimit} members.`)
  }

  // Add to members
  const { error: joinError } = await supabase.from('hackathon_team_members').insert({
    team_id: team.id,
    profile_id: request.profile_id
  })

  if (joinError) throw new Error(joinError.message)

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

  return team
}

// 4. Invite/directly add a registered user
export async function inviteMember(teamId: string, profileId: string, actorId: string) {
  const supabase = await createClient()

  // Fetch team info
  const { data: team } = await supabase
    .from('hackathon_teams')
    .select('*, event:events(*)')
    .eq('id', teamId)
    .single()

  if (!team) throw new Error('Team not found.')
  if (team.event && team.event.team_invites_enabled === false) {
    throw new Error('Direct invitations are currently closed/disabled by the host.')
  }
  if (team.leader_id !== actorId) throw new Error('Only the team leader can add members.')

  // Check if invitee is registered
  const { data: reg } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', team.event_id)
    .eq('student_id', profileId)
    .maybeSingle()

  if (!reg) throw new Error('This user is not registered for the event.')

  // Check if already in a team
  const { data: existingMember } = await supabase
    .from('hackathon_team_members')
    .select('id, team:hackathon_teams(event_id)')
    .eq('profile_id', profileId)

  const inTeam = (existingMember || []).some((m: any) => m.team?.event_id === team.event_id)
  if (inTeam) throw new Error('This user is already in a team.')

  // Check max members
  const { count: memberCount } = await supabase
    .from('hackathon_team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)

  const maxLimit = team.event?.max_team_members || 4
  if ((memberCount || 0) >= maxLimit) {
    throw new Error(`This team has reached its limit of ${maxLimit} members.`)
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

  return team
}

// 5. Leave team
export async function leaveTeam(teamId: string, actorId: string) {
  const supabase = await createClient()

  // Fetch team info
  const { data: team } = await supabase
    .from('hackathon_teams')
    .select('*, event:events(team_deletion_enabled)')
    .eq('id', teamId)
    .single()

  if (!team) throw new Error('Team not found.')

  const eventSettings = (team as any).event
  if (eventSettings && eventSettings.team_deletion_enabled === false) {
    throw new Error('Leaving or deleting teams is currently closed/disabled by the host.')
  }

  if (team.leader_id === actorId) {
    // If leader leaves, delete the team entirely
    await supabase.from('hackathon_teams').delete().eq('id', teamId)
  } else {
    // Remove membership
    await supabase
      .from('hackathon_team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('profile_id', actorId)
  }

  return team
}

// 6. Get Event Teams Data
export async function getEventTeamsData(eventId: string, actorId: string) {
  const supabase = await createClient()

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
  const myMembership = memberships.find(m => m.profile_id === actorId)
  const myTeam = myMembership ? teams?.find(t => t.id === myMembership.team_id) : null
  const myTeamMembers = myTeam ? memberships.filter(m => m.team_id === myTeam.id) : []
  const myTeamRequests = myTeam && myTeam.leader_id === actorId ? requests.filter(r => r.team_id === myTeam.id) : []

  // Sent requests context
  const mySentRequests = requests.filter(r => r.profile_id === actorId).map(r => ({
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

// 7. Submit Project
export async function submitProject(
  payload: {
    eventId: string
    teamId: string
    title: string
    description: string
    repoUrl: string
    demoUrl: string
    techStack?: string
    slidesUrl?: string
    designUrl?: string
    futureScope?: string
  },
  actorId: string
) {
  const supabase = await createClient()

  // Verify membership in the team
  const { data: membership } = await supabase
    .from('hackathon_team_members')
    .select('id')
    .eq('team_id', payload.teamId)
    .eq('profile_id', actorId)
    .maybeSingle()

  if (!membership) {
    throw new Error('Only team members can submit the project.')
  }

  const { data, error } = await supabase
    .from('hackathon_submissions')
    .upsert({
      event_id: payload.eventId,
      team_id: payload.teamId,
      project_title: payload.title,
      project_description: payload.description,
      repo_url: payload.repoUrl,
      demo_url: payload.demoUrl,
      tech_stack: payload.techStack,
      slides_url: payload.slidesUrl,
      design_url: payload.designUrl,
      future_scope: payload.futureScope,
      submitted_at: new Date().toISOString()
    }, {
      onConflict: 'team_id'
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

// 8. Assign Judge
export async function assignJudge(eventId: string, judgeId: string, actorId: string) {
  const supabase = await createClient()
  await assertGlobalRole(['admin', 'cc', 'teacher'])

  const { error } = await supabase
    .from('hackathon_judges')
    .insert({
      event_id: eventId,
      judge_id: judgeId
    })

  if (error) {
    if (error.code === '23505') throw new Error('Judge is already assigned to this event.')
    throw new Error(error.message)
  }
}

// 9. Remove Judge
export async function removeJudge(eventId: string, judgeId: string, actorId: string) {
  const supabase = await createClient()
  await assertGlobalRole(['admin', 'cc', 'teacher'])

  const { error } = await supabase
    .from('hackathon_judges')
    .delete()
    .eq('event_id', eventId)
    .eq('judge_id', judgeId)

  if (error) throw new Error(error.message)
}

// 10. Get assigned judges
export async function getAssignedJudges(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hackathon_judges')
    .select('id, judge_id, judge:profiles(full_name, usn, department)')
    .eq('event_id', eventId)

  if (error) throw new Error(error.message)
  return data || []
}

// 11. Get available teachers
export async function getAvailableTeachers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, usn, department')
    .eq('role', 'teacher')
    .order('full_name')

  if (error) throw new Error(error.message)
  return data || []
}

// 12. Submit Evaluation
export async function submitEvaluation(
  submissionId: string,
  scores: {
    innovation: number
    technical: number
    design: number
    presentation: number
  },
  feedback: string,
  actorId: string
) {
  const supabase = await createClient()

  // Verify they are a judge for this event
  const { data: submission } = await supabase
    .from('hackathon_submissions')
    .select('event_id')
    .eq('id', submissionId)
    .single()

  if (!submission) throw new Error('Submission not found.')

  const { data: isJudge } = await supabase
    .from('hackathon_judges')
    .select('id')
    .eq('event_id', submission.event_id)
    .eq('judge_id', actorId)
    .maybeSingle()

  if (!isJudge) throw new Error('You are not assigned as a judge for this event.')

  const { error } = await supabase
    .from('hackathon_evaluations')
    .upsert({
      submission_id: submissionId,
      judge_id: actorId,
      score_innovation: scores.innovation,
      score_technical: scores.technical,
      score_design: scores.design,
      score_presentation: scores.presentation,
      feedback
    }, {
      onConflict: 'submission_id,judge_id'
    })

  if (error) throw new Error(error.message)
  return submission.event_id
}

// 13. Get Scoreboard
export async function getScoreboard(eventId: string) {
  const supabase = await createClient()

  // Fetch all submissions
  const { data: submissions, error: subError } = await supabase
    .from('hackathon_submissions')
    .select('*, team:hackathon_teams(team_name, leader:profiles(full_name))')
    .eq('event_id', eventId)

  if (subError) throw new Error(subError.message)
  if (!submissions || submissions.length === 0) return []

  const subIds = submissions.map(s => s.id)

  // Fetch all evaluations
  const { data: evaluations, error: evalError } = await supabase
    .from('hackathon_evaluations')
    .select('*')
    .in('submission_id', subIds)

  if (evalError) throw new Error(evalError.message)

  // Calculate averages
  const scoreboard = submissions.map(sub => {
    const subsEval = evaluations?.filter(e => e.submission_id === sub.id) || []
    if (subsEval.length === 0) {
      return {
        submission_id: sub.id,
        team_id: sub.team_id,
        team_name: sub.team?.team_name || 'Unknown Team',
        project_title: sub.project_title,
        average_score: 0,
        eval_count: 0
      }
    }

    const totalScore = subsEval.reduce((acc, curr) => {
      const sum = (curr.score_innovation || 0) +
                  (curr.score_technical || 0) +
                  (curr.score_design || 0) +
                  (curr.score_presentation || 0)
      return acc + sum
    }, 0)

    const avg = totalScore / subsEval.length

    return {
      submission_id: sub.id,
      team_id: sub.team_id,
      team_name: sub.team?.team_name || 'Unknown Team',
      project_title: sub.project_title,
      average_score: Math.round(avg * 10) / 10,
      eval_count: subsEval.length
    }
  })

  // Sort descending by score
  scoreboard.sort((a, b) => b.average_score - a.average_score)

  return scoreboard
}

// 14. Announce Winners
export async function announceWinners(
  eventId: string,
  winnerTeamId: string | null,
  runnerUpTeamId: string | null,
  actorId: string
) {
  const supabase = await createClient()
  await assertGlobalRole(['admin', 'cc', 'teacher'])

  const { error } = await supabase
    .from('events')
    .update({
      winners_announced: true,
      winner_team_id: winnerTeamId,
      runner_up_team_id: runnerUpTeamId
    })
    .eq('id', eventId)

  if (error) throw new Error(error.message)
}

// 15. Plagiarism Check
export async function runPlagiarismCheck(eventId: string, actorId: string) {
  const supabase = await createClient()
  await assertGlobalRole(['admin', 'cc', 'teacher'])

  // Fetch all submissions
  const { data: submissions, error } = await supabase
    .from('hackathon_submissions')
    .select('id, project_title, project_description, git_readme_content, team_id, team:hackathon_teams(team_name)')
    .eq('event_id', eventId)

  if (error || !submissions || submissions.length < 2) {
    throw new Error('Not enough submissions to run check.')
  }

  const { computeCosineSimilarity, computeJaroWinkler } = await import('@/lib/services/github-scanner')

  for (let i = 0; i < submissions.length; i++) {
    let maxSimilarity = 0.0
    for (let j = 0; j < submissions.length; j++) {
      if (i === j) continue

      let similarity = 0.0
      const readme1 = submissions[i].git_readme_content
      const readme2 = submissions[j].git_readme_content

      if (readme1 && readme2 && readme1.length > 50 && readme2.length > 50) {
        similarity = computeCosineSimilarity(readme1, readme2)
      } else {
        const desc1 = `${submissions[i].project_title} ${submissions[i].project_description}`.toLowerCase()
        const desc2 = `${submissions[j].project_title} ${submissions[j].project_description}`.toLowerCase()
        similarity = computeJaroWinkler(desc1, desc2)
      }

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity
      }
    }

    // Save similarity index
    await supabase
      .from('hackathon_submissions')
      .update({ git_plagiarism_index: Math.round(maxSimilarity * 100) / 100 })
      .eq('id', submissions[i].id)
  }
}
