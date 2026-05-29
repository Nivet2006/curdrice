'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function processTeacherVerification(eventId: string, decision: 'approve' | 'reject', feedback: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    return { error: 'Unauthorized: Requires Teacher permissions.' }
  }

  const approval_status = decision === 'approve' ? 'pending_hod' : 'rejected'

  const { error } = await supabase
    .from('events')
    .update({ 
      approval_status,
      rejection_data: decision === 'reject' ? [{ field: 'faculty_review', reason: feedback }] : []
    })
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/teacher/dashboard')
  redirect('/teacher/dashboard')
}

export async function processHODApproval(eventId: string, decision: 'approve' | 'reject', feedback: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'hod' && profile?.role !== 'admin') {
    return { error: 'Unauthorized: Requires HOD permissions.' }
  }

  const approval_status = decision === 'approve' ? 'approved' : 'rejected'

  const { error } = await supabase
    .from('events')
    .update({ 
      approval_status,
      rejection_data: decision === 'reject' ? [{ field: 'hod_review', reason: feedback }] : []
    })
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/hod/dashboard')
  redirect('/hod/dashboard')
}

export async function addReportMarkup(reportId: string, sectionKey: string, comment: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('report_markups')
    .insert({
      report_id: reportId,
      author_id: user.id,
      section_key: sectionKey,
      comment
    })

  if (error) return { error: error.message }

  revalidatePath(`/teacher/reports/${reportId}`)
  revalidatePath(`/pr/reports/${reportId}`)
  return { success: true }
}

// ============================================
// PR Event Assignment Actions
// ============================================

export async function assignPRToEvent(eventId: string, prId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['teacher', 'hod', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Requires Faculty permissions.' }
  }

  // Check max 2 PRs per event
  const { data: existing } = await supabase
    .from('pr_event_assignments')
    .select('id')
    .eq('event_id', eventId)

  if (existing && existing.length >= 2) {
    return { error: 'Maximum 2 PR officers can be assigned per event.' }
  }

  const { error } = await supabase
    .from('pr_event_assignments')
    .insert({
      event_id: eventId,
      pr_id: prId,
      assigned_by: user.id
    })

  if (error) {
    if (error.code === '23505') return { error: 'This PR is already assigned to this event.' }
    return { error: error.message }
  }

  revalidatePath(`/teacher/verify/${eventId}`)
  return { success: true }
}

export async function removePRFromEvent(eventId: string, prId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['teacher', 'hod', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Requires Faculty permissions.' }
  }

  const { error } = await supabase
    .from('pr_event_assignments')
    .delete()
    .eq('event_id', eventId)
    .eq('pr_id', prId)

  if (error) return { error: error.message }

  revalidatePath(`/teacher/verify/${eventId}`)
  return { success: true }
}

export async function getAssignedPRs(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pr_event_assignments')
    .select('id, pr_id, assigned_at, profiles!pr_event_assignments_pr_id_fkey(full_name, usn, department)')
    .eq('event_id', eventId)

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

export async function getAvailablePRs() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, usn, department')
    .eq('role', 'pr')
    .order('full_name')

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}
