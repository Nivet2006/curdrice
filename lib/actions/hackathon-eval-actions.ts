'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Submit or update a project
export async function submitProject(
  eventId: string,
  teamId: string,
  title: string,
  description: string,
  repoUrl: string,
  demoUrl: string,
  techStack?: string,
  slidesUrl?: string,
  designUrl?: string,
  futureScope?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify membership in the team
  const { data: membership } = await supabase
    .from('hackathon_team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!membership) {
    return { error: 'Only team members can submit the project.' }
  }

  const { data, error } = await supabase
    .from('hackathon_submissions')
    .upsert({
      event_id: eventId,
      team_id: teamId,
      project_title: title,
      project_description: description,
      repo_url: repoUrl,
      demo_url: demoUrl,
      tech_stack: techStack,
      slides_url: slidesUrl,
      design_url: designUrl,
      future_scope: futureScope,
      submitted_at: new Date().toISOString()
    }, {
      onConflict: 'team_id'
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Proactively trigger GitHub Repository Scan in background
  if (repoUrl) {
    try {
      scanSubmission(data.id).catch(console.error)
    } catch {}
  }

  revalidatePath(`/student/events/${eventId}`)
  revalidatePath(`/student/events/${eventId}/showcase`)
  return { success: true, submission: data }
}

// 2. Assign a Judge to a hackathon
export async function assignJudge(eventId: string, judgeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if current user is admin/cc
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'cc', 'teacher'].includes(profile.role)) {
    return { error: 'Unauthorized role to assign judges.' }
  }

  const { error } = await supabase
    .from('hackathon_judges')
    .insert({
      event_id: eventId,
      judge_id: judgeId
    })

  if (error) {
    if (error.code === '23505') return { error: 'Judge is already assigned to this event.' }
    return { error: error.message }
  }

  return { success: true }
}

// Remove a Judge from a hackathon
export async function removeJudge(eventId: string, judgeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'cc', 'teacher'].includes(profile.role)) {
    return { error: 'Unauthorized role to remove judges.' }
  }

  const { error } = await supabase
    .from('hackathon_judges')
    .delete()
    .eq('event_id', eventId)
    .eq('judge_id', judgeId)

  if (error) return { error: error.message }
  return { success: true }
}

// Get assigned judges for an event
export async function getAssignedJudges(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hackathon_judges')
    .select('id, judge_id, judge:profiles(full_name, usn, department)')
    .eq('event_id', eventId)

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

// Get available teachers to be assigned as judges
export async function getAvailableTeachers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, usn, department')
    .eq('role', 'teacher')
    .order('full_name')

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

// 3. Submit Evaluation Scores
export async function submitEvaluation(
  submissionId: string,
  scores: {
    innovation: number
    technical: number
    design: number
    presentation: number
  },
  feedback: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify they are a judge for this event
  const { data: submission } = await supabase
    .from('hackathon_submissions')
    .select('event_id')
    .eq('id', submissionId)
    .single()

  if (!submission) return { error: 'Submission not found.' }

  const { data: isJudge } = await supabase
    .from('hackathon_judges')
    .select('id')
    .eq('event_id', submission.event_id)
    .eq('judge_id', user.id)
    .maybeSingle()

  if (!isJudge) return { error: 'You are not assigned as a judge for this event.' }

  const { error } = await supabase
    .from('hackathon_evaluations')
    .upsert({
      submission_id: submissionId,
      judge_id: user.id,
      score_innovation: scores.innovation,
      score_technical: scores.technical,
      score_design: scores.design,
      score_presentation: scores.presentation,
      feedback
    }, {
      onConflict: 'submission_id,judge_id'
    })

  if (error) return { error: error.message }

  revalidatePath(`/student/events/${submission.event_id}/showcase`)
  return { success: true }
}

// 4. Retrieve Scoreboard
export async function getScoreboard(eventId: string) {
  const supabase = await createClient()

  // Fetch all submissions for the event
  const { data: submissions, error: subError } = await supabase
    .from('hackathon_submissions')
    .select('*, team:hackathon_teams(team_name, leader:profiles(full_name))')
    .eq('event_id', eventId)

  if (subError) return { error: subError.message }
  if (!submissions || submissions.length === 0) return { scoreboard: [] }

  const subIds = submissions.map(s => s.id)

  // Fetch all evaluations for these submissions
  const { data: evaluations, error: evalError } = await supabase
    .from('hackathon_evaluations')
    .select('*')
    .in('submission_id', subIds)

  if (evalError) return { error: evalError.message }

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
      average_score: Math.round(avg * 10) / 10, // Round to 1 decimal place
      eval_count: subsEval.length
    }
  })

  // Sort descending by score
  scoreboard.sort((a, b) => b.average_score - a.average_score)

  return { scoreboard }
}

// 5. Announce Winners
export async function announceWinners(
  eventId: string,
  winnerTeamId: string | null,
  runnerUpTeamId: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify CC or Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'cc', 'teacher'].includes(profile.role)) {
    return { error: 'Unauthorized.' }
  }

  const { error } = await supabase
    .from('events')
    .update({
      winners_announced: true,
      winner_team_id: winnerTeamId,
      runner_up_team_id: runnerUpTeamId
    })
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath(`/student/events/${eventId}`)
  revalidatePath(`/student/events/${eventId}/showcase`)
  return { success: true }
}

// 6. GitHub Scanner Actions
export async function scanSubmission(submissionId: string) {
  try {
    const { runFullGitScan } = await import('@/lib/services/github-scanner')
    return await runFullGitScan(submissionId)
  } catch (e: any) {
    console.error('Scan error:', e)
    return { error: e.message || 'Scan failed due to an unexpected error.' }
  }
}

// 7. Plagiarism scan action
export async function runPlagiarismCheck(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'cc', 'teacher'].includes(profile.role)) {
    return { error: 'Unauthorized role.' }
  }

  // Fetch all submissions
  const { data: submissions, error } = await supabase
    .from('hackathon_submissions')
    .select('id, project_title, project_description, git_readme_content, team_id, team:hackathon_teams(team_name)')
    .eq('event_id', eventId)

  if (error || !submissions || submissions.length < 2) {
    return { error: 'Not enough submissions to run check.' }
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
        // Compute on readme contents if available
        similarity = computeCosineSimilarity(readme1, readme2)
      } else {
        // Fallback to title and description
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

  revalidatePath(`/student/events/${eventId}/showcase`)
  return { success: true }
}


