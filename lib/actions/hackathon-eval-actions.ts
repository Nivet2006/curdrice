'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import * as hackathonService from '@/lib/services/hackathon-service'

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

  try {
    const data = await hackathonService.submitProject({
      eventId,
      teamId,
      title,
      description,
      repoUrl,
      demoUrl,
      techStack,
      slidesUrl,
      designUrl,
      futureScope
    }, user.id)

    // Proactively trigger GitHub Repository Scan in background
    if (repoUrl) {
      try {
        scanSubmission(data.id).catch(console.error)
      } catch {}
    }

    revalidatePath(`/student/events/${eventId}`)
    revalidatePath(`/student/events/${eventId}/showcase`)
    return { success: true, submission: data }
  } catch (error: any) {
    return { error: error.message }
  }
}

// 2. Assign a Judge to a hackathon
export async function assignJudge(eventId: string, judgeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await hackathonService.assignJudge(eventId, judgeId, user.id)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Remove a Judge from a hackathon
export async function removeJudge(eventId: string, judgeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await hackathonService.removeJudge(eventId, judgeId, user.id)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Get assigned judges for an event
export async function getAssignedJudges(eventId: string) {
  try {
    const data = await hackathonService.getAssignedJudges(eventId)
    return { data }
  } catch (error: any) {
    return { error: error.message, data: [] }
  }
}

// Get available teachers to be assigned as judges
export async function getAvailableTeachers() {
  try {
    const data = await hackathonService.getAvailableTeachers()
    return { data }
  } catch (error: any) {
    return { error: error.message, data: [] }
  }
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

  try {
    const eventId = await hackathonService.submitEvaluation(submissionId, scores, feedback, user.id)
    revalidatePath(`/student/events/${eventId}/showcase`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// 4. Retrieve Scoreboard
export async function getScoreboard(eventId: string) {
  try {
    const scoreboard = await hackathonService.getScoreboard(eventId)
    return { scoreboard }
  } catch (error: any) {
    return { error: error.message }
  }
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

  try {
    await hackathonService.announceWinners(eventId, winnerTeamId, runnerUpTeamId, user.id)
    revalidatePath(`/student/events/${eventId}`)
    revalidatePath(`/student/events/${eventId}/showcase`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
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

  try {
    await hackathonService.runPlagiarismCheck(eventId, user.id)
    revalidatePath(`/student/events/${eventId}/showcase`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
